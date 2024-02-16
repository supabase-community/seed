import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { buildSchemaExclusionClause } from "./utils.js";

type FetchSequencesResult = {
  schema: string
  name: string
  start: number
  current: number
  interval: number
}

const FETCH_SEQUENCES = `
SELECT
  schemaname AS schema,
  sequencename AS name,
  start_value AS start,
  COALESCE(last_value, start_value) AS current,
  increment_by AS interval
FROM
 pg_sequences
WHERE ${buildSchemaExclusionClause('pg_sequences.schemaname')}
`

export async function fetchSequences<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_SEQUENCES),
  )) as postgres.RowList<Array<FetchSequencesResult>>;

  return response.map((r) => ({
    schema: r.schema,
    name: r.name,
    // When a sequence is created, the current value is the start value and is available for use
    // but when the sequence is used for the first time, the current values is the last used one not available for use
    // so we increment it by one to get the next available value instead
    current: r.start === r.current ? Number(r.current) : Number(r.current) + 1,
    interval: Number(r.interval),
  }))
}