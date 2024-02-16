import { buildSchemaExclusionClause } from './utils.js'
import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";

type FetchExtensionsResult = {
  name: string
  version: string
  schema: string
}

const FETCH_EXTENSIONS = `
  WITH
  accessible_schemas AS (
    SELECT
      schema_name
    FROM information_schema.schemata
    WHERE
      ${buildSchemaExclusionClause('schema_name')}
  )
  SELECT
    e.extname AS "name",
    e.extversion AS "version",
    n.nspname AS "schema"
  FROM
    pg_catalog.pg_extension e
    INNER JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
    INNER JOIN pg_catalog.pg_description c ON c.objoid = e.oid AND c.classoid = 'pg_catalog.pg_extension'::pg_catalog.regclass
    INNER JOIN accessible_schemas s ON s.schema_name = n.nspname
  WHERE  ${buildSchemaExclusionClause('n.nspname')}
  ORDER BY schema_name
`
export async function fetchExtensions<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_EXTENSIONS),
  )) as postgres.RowList<Array<FetchExtensionsResult>>;
  return response
}
