import { type DatabaseClient } from "#core/adapters.js";
import { buildSchemaExclusionClause } from "./utils.js";

interface FetchSchemasResult {
  schemaName: string;
}
const FETCH_AUTHORIZED_SCHEMAS = `
  SELECT
    schema_name as "schemaName"
  FROM
    information_schema.schemata
  WHERE
    ${buildSchemaExclusionClause("schema_name")} AND
    pg_catalog.has_schema_privilege(current_user, schema_name, 'USAGE')
  ORDER BY schema_name
`;

export async function fetchSchemas(client: DatabaseClient) {
  const response = await client.query<FetchSchemasResult>(
    FETCH_AUTHORIZED_SCHEMAS,
  );

  return response.map((row) => row.schemaName);
}
