import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

interface FetchPrimaryKeysResult {
  name: string;
  schema: string;
  table: string;
  tableId: string;
  type: string;
}

const FETCH_PRIMARY_KEYS = (schemas: Array<string>) => `
SELECT 
  tc.TABLE_SCHEMA AS \`schema\`,
  tc.TABLE_NAME AS \`table\`,
  CONCAT(tc.TABLE_SCHEMA, '.', tc.TABLE_NAME) AS tableId,
  kcu.COLUMN_NAME AS name,
  cols.DATA_TYPE AS type
FROM 
  information_schema.TABLE_CONSTRAINTS AS tc
JOIN 
  information_schema.KEY_COLUMN_USAGE AS kcu 
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
    AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
    AND tc.TABLE_NAME = kcu.TABLE_NAME
JOIN
  information_schema.COLUMNS AS cols
    ON cols.TABLE_SCHEMA = tc.TABLE_SCHEMA
    AND cols.TABLE_NAME = tc.TABLE_NAME
    AND cols.COLUMN_NAME = kcu.COLUMN_NAME
WHERE 
  tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND
  ${buildSchemaInclusionClause(schemas, "tc.TABLE_SCHEMA")}
UNION ALL
SELECT 
  s.TABLE_SCHEMA AS \`schema\`,
  s.TABLE_NAME AS \`table\`,
  CONCAT(s.TABLE_SCHEMA, '.', s.TABLE_NAME) AS tableId,
  s.COLUMN_NAME AS name,
  cols.DATA_TYPE AS type
FROM 
  information_schema.STATISTICS AS s
JOIN
  information_schema.COLUMNS AS cols
    ON cols.TABLE_SCHEMA = s.TABLE_SCHEMA
    AND cols.TABLE_NAME = s.TABLE_NAME
    AND cols.COLUMN_NAME = s.COLUMN_NAME
WHERE 
  s.NON_UNIQUE = 0 AND
  s.INDEX_NAME != 'PRIMARY' AND
  cols.IS_NULLABLE = 'NO' AND
  ${buildSchemaInclusionClause(schemas, "s.TABLE_SCHEMA")}
ORDER BY 
  \`schema\`, \`table\`;
`;

export async function fetchPrimaryKeys(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  const rawRows = await client.query<FetchPrimaryKeysResult>(
    FETCH_PRIMARY_KEYS(schemas),
  );
  const groupedResults = rawRows.reduce<
    Record<
      string,
      {
        dirty: boolean;
        keys: Array<{
          name: string;
          type: string;
        }>;
        schema: string;
        table: string;
        tableId: string;
      }
    >
  >((acc, row) => {
    const key = row.tableId;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[key]) {
      acc[key] = {
        dirty: false,
        table: row.table,
        schema: row.schema,
        tableId: row.tableId,
        keys: [],
      };
    }
    // rawRows might contains duplicates for the same column
    if (
      !acc[key].keys.some(
        (key) => key.name === row.name && key.type === row.type,
      )
    ) {
      acc[key].keys.push({
        name: row.name,
        type: row.type,
      });
    }
    return acc;
  }, {});

  return Object.values(groupedResults);
}
