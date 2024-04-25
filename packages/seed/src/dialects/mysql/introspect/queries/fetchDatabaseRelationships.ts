import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

interface FetchRelationshipsInfosResult {
  fkColumn: string;
  fkTable: string;
  id: string;
  nullable: boolean;
  targetColumn: string;
  targetTable: string;
  type: string;
}

const FETCH_RELATIONSHIPS_INFOS = (schemas: Array<string>) => `
  SELECT
    kcu.CONSTRAINT_NAME AS id,
    CONCAT(kcu.TABLE_SCHEMA, '.', kcu.TABLE_NAME) AS fkTable,
    kcu.COLUMN_NAME AS fkColumn,
    col.COLUMN_TYPE AS type,
    kcu.REFERENCED_COLUMN_NAME AS targetColumn,
    col.IS_NULLABLE = 'YES' AS nullable,
    CONCAT(kcu.REFERENCED_TABLE_SCHEMA, '.', kcu.REFERENCED_TABLE_NAME) AS targetTable
  FROM information_schema.KEY_COLUMN_USAGE kcu
  JOIN information_schema.COLUMNS col ON col.TABLE_SCHEMA = kcu.TABLE_SCHEMA
    AND col.TABLE_NAME = kcu.TABLE_NAME
    AND col.COLUMN_NAME = kcu.COLUMN_NAME
  JOIN information_schema.COLUMNS refcol ON refcol.TABLE_SCHEMA = kcu.REFERENCED_TABLE_SCHEMA
    AND refcol.TABLE_NAME = kcu.REFERENCED_TABLE_NAME
    AND refcol.COLUMN_NAME = kcu.REFERENCED_COLUMN_NAME
  WHERE kcu.REFERENCED_TABLE_NAME IS NOT NULL
    AND ${buildSchemaInclusionClause(schemas, "kcu.TABLE_SCHEMA")}
  ORDER BY fkTable, targetTable, kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION;
`;

export async function fetchDatabaseRelationships(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  const query = FETCH_RELATIONSHIPS_INFOS(schemas);
  const rows = await client.query<FetchRelationshipsInfosResult>(query);

  const relationships = rows.reduce<
    Record<
      string,
      {
        dirty: boolean;
        fkTable: string;
        id: string;
        keys: Array<{
          fkColumn: string;
          nullable: boolean;
          targetColumn: string;
          type: string;
        }>;
        targetTable: string;
      }
    >
  >((acc, row) => {
    const { id, fkTable, targetTable } = row;
    const keyInfo = {
      fkColumn: row.fkColumn,
      type: row.type,
      nullable: Boolean(row.nullable),
      targetColumn: row.targetColumn,
    };

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[id]) {
      acc[id] = {
        fkTable,
        id,
        keys: [],
        targetTable,
        dirty: false,
      };
    }
    acc[id].keys.push(keyInfo);
    return acc;
  }, {});

  return Object.values(relationships);
}
