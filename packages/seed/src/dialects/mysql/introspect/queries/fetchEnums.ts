import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaInclusionClause } from "./utils.js";

interface FetchEnumsResult {
  id: string;
  name: string;
  schema: string;
  values: string;
}

const FETCH_ENUMS = (schemas: Array<string>) => `
  SELECT
    TABLE_SCHEMA AS \`schema\`,
    COLUMN_NAME AS name,
    CONCAT(TABLE_SCHEMA, '.', COLUMN_NAME) AS id,
    SUBSTRING(COLUMN_TYPE FROM 6 FOR LENGTH(COLUMN_TYPE) - 6) AS \`values\`
  FROM information_schema.COLUMNS
  WHERE
    DATA_TYPE = 'enum' AND
    ${buildSchemaInclusionClause(schemas, "TABLE_SCHEMA")}
  ORDER BY CONCAT(TABLE_SCHEMA, '.', COLUMN_NAME);
`;

export async function fetchEnums(
  client: DatabaseClient,
  schemas: Array<string>, // list of schemas related to the current database
) {
  const response = await client.query<FetchEnumsResult>(FETCH_ENUMS(schemas));
  return response.map((row) => ({
    ...row,
    // Splitting the values string by comma, then trim spaces and remove single quotes
    values: row.values
      .split(",")
      .map((value) => value.trim().replace(/^'(.*)'$/, "$1")),
  }));
}
