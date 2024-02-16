import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { buildSchemaExclusionClause } from "./utils.js";

interface FetchSequencesResult {
  schema: string;
  table: string;
  column: string;
  sequence: string;
}

const FETCH_SEQUENCES = `
  WITH
  accessible_schemas AS (
    SELECT
      schema_name
    FROM information_schema.schemata
    WHERE
      ${buildSchemaExclusionClause('schema_name')}
  )
  SELECT
    n.nspname AS schema,
    t.relname AS table,
    a.attname AS column,
    s.relname AS sequence
  FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid
    JOIN pg_class t ON d.objid = s.oid AND d.refobjid = t.oid
    JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
    JOIN pg_namespace n ON n.oid = s.relnamespace
    INNER JOIN accessible_schemas acc ON acc.schema_name = n.nspname
  WHERE s.relkind = 'S'
  ORDER BY n.nspname, t.relname
`;

export async function fetchSequences<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_SEQUENCES),
  )) as postgres.RowList<Array<FetchSequencesResult>>;

  return response;
}