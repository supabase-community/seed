import { type DatabaseClient } from "#core/databaseClient.js";
import { buildSchemaExclusionClause } from "./utils.js";

interface FetchSchemasResult {
  schemaName: string;
}
const FETCH_AUTHORIZED_SCHEMAS = `
  SELECT
    SCHEMA_NAME as schemaName
  FROM
    information_schema.schemata
  WHERE
    ${buildSchemaExclusionClause("SCHEMA_NAME")} AND
    SCHEMA_NAME = DATABASE()
  ORDER BY SCHEMA_NAME
`;

export async function fetchSchemas(client: DatabaseClient) {
  const response = await client.query<FetchSchemasResult>(
    FETCH_AUTHORIZED_SCHEMAS,
  );

  return response.map((row) => row.schemaName);
}
