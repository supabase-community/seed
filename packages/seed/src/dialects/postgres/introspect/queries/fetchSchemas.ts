import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
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

export async function fetchSchemas<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_AUTHORIZED_SCHEMAS),
  )) as postgres.RowList<Array<FetchSchemasResult>>;

  return response.map((row) => row.schemaName);
}
