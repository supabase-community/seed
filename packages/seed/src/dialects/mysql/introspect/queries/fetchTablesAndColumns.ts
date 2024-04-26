import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

const COLUMN_CONSTRAINTS = {
  "PRIMARY KEY": "p",
  "FOREIGN KEY": "f",
  UNIQUE: "u",
} as const;

type ColumnsConstraintsKeys = keyof typeof COLUMN_CONSTRAINTS;
interface ColumnResult {
  constraints:
    | `${`${ColumnsConstraintsKeys},${ColumnsConstraintsKeys}` | ColumnsConstraintsKeys}`
    | null;
  default: null | string;
  generated: 0 | 1;
  id: string;
  maxLength: null | number;
  name: string;
  nullable: 0 | 1;
  schema: string;
  table: string;
  type: string;
}

interface TableResult {
  id: string;
  name: string;
  schema: string;
}

const FETCH_COLUMNS = (schemas: Array<string>) => `
SELECT
  CONCAT(c.TABLE_SCHEMA, '.', c.TABLE_NAME, '.', c.COLUMN_NAME) AS id,
  c.TABLE_SCHEMA as \`schema\`,
  c.TABLE_NAME as \`table\`,
  c.COLUMN_NAME as \`name\`,
  c.DATA_TYPE AS \`type\`,
  c.IS_NULLABLE = 'YES' AS \`nullable\`,
  c.CHARACTER_MAXIMUM_LENGTH AS maxLength,
  c.COLUMN_DEFAULT AS \`default\`,
  EXTRA LIKE '%STORED_GENERATED%' AS \`generated\`,
  GROUP_CONCAT(DISTINCT tc.CONSTRAINT_TYPE ORDER BY tc.CONSTRAINT_TYPE) as constraints
FROM
  information_schema.COLUMNS as c
LEFT JOIN
  information_schema.KEY_COLUMN_USAGE as k
  ON c.TABLE_SCHEMA = k.TABLE_SCHEMA
  AND c.TABLE_NAME = k.TABLE_NAME
  AND c.COLUMN_NAME = k.COLUMN_NAME
LEFT JOIN
  information_schema.TABLE_CONSTRAINTS as tc
  ON k.TABLE_SCHEMA = tc.TABLE_SCHEMA
  AND k.TABLE_NAME = tc.TABLE_NAME
  AND k.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
WHERE
  ${buildSchemaInclusionClause(schemas, "c.TABLE_SCHEMA")} AND
  (tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE') OR tc.CONSTRAINT_TYPE IS NULL)
GROUP BY
  c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE,
  c.CHARACTER_MAXIMUM_LENGTH, c.COLUMN_DEFAULT, c.EXTRA
ORDER BY
  c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME;
`;

const FETCH_TABLES = (schemas: Array<string>) => `
  SELECT 
    TABLE_SCHEMA AS \`schema\`,
    TABLE_NAME AS \`name\`,
    CONCAT(TABLE_SCHEMA, '.', TABLE_NAME) AS \`id\`
  FROM information_schema.TABLES
  WHERE ${buildSchemaInclusionClause(schemas, "TABLE_SCHEMA")}
`;

export async function fetchTablesAndColumns(
  client: DatabaseClient,
  schemas: Array<string>,
) {
  const tables = await client.query<TableResult>(FETCH_TABLES(schemas));
  const columns = await client.query<ColumnResult>(FETCH_COLUMNS(schemas));

  const tablesWithColumns = tables.map((table) => ({
    ...table,
    columns: columns
      .filter(
        (column) =>
          column.table === table.name && column.schema === table.schema,
      )
      .map((column) => ({
        ...column,
        generated: Boolean(column.generated),
        constraints: column.constraints
          ? column.constraints
              .split(",")
              .map((ck) => COLUMN_CONSTRAINTS[ck as ColumnsConstraintsKeys])
          : [],
        type:
          column.type === "enum"
            ? `enum.${table.schema}.${table.name}.${column.name}`
            : column.type,
        nullable: column.nullable === 1,
      })),
  }));

  return tablesWithColumns;
}
