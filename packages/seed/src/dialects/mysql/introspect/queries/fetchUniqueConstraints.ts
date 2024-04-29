import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

interface FetchUniqueConstraintsResult {
  /**
   * The columns that are part of the constraint
   */
  columns: Array<string>;
  /**
   * allows us to always know if the constraint we are using
   * are the one retrieved from the database or the one we augmented via user setting or fallback
   */
  dirty: boolean;
  /**
   * The constraint name
   */
  name: string;
  /**
   * The schema name
   */
  schema: string;
  /**
   * The table name
   */
  table: string;
  /**
   * The table id (schemaName.tableName)
   */
  tableId: string;
}

const FETCH_UNIQUE_CONSTRAINTS = (schemas: Array<string>) => `
SELECT 
  tc.CONSTRAINT_SCHEMA as \`schema\`,
  tc.TABLE_NAME as \`table\`,
  tc.CONSTRAINT_NAME as \`name\`,
  GROUP_CONCAT(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION) as \`columns\`
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
  AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
  AND tc.TABLE_NAME = kcu.TABLE_NAME
WHERE (tc.CONSTRAINT_TYPE = 'UNIQUE' OR tc.CONSTRAINT_TYPE = 'PRIMARY KEY') AND ${buildSchemaInclusionClause(schemas, "tc.TABLE_SCHEMA")}
GROUP BY tc.CONSTRAINT_SCHEMA, tc.TABLE_NAME, tc.CONSTRAINT_NAME
`;

export async function fetchUniqueConstraints(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  const response = await client.query<{
    columns: string;
    name: string;
    schema: string;
    table: string;
  }>(FETCH_UNIQUE_CONSTRAINTS(schemas));

  return response.map(
    (row) =>
      ({
        columns: row.columns.split(","),
        dirty: false,
        name: `${row.schema}.${row.table}.${row.columns.split(",").join("_")}`,
        schema: row.schema,
        table: row.table,
        tableId: `${row.schema}.${row.table}`,
      }) satisfies FetchUniqueConstraintsResult,
  );
}
