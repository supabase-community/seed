import type postgres from "postgres";
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";

interface FetchServerVersionResult {
  server_version: string;
}

const FETCH_SERVER_VERSION = `SHOW server_version`;

export async function fetchServerVersion<T extends QueryResultHKT>(
  client: PgDatabase<T>,
) {
  const response = (await client.execute(
    sql.raw(FETCH_SERVER_VERSION),
  )) as postgres.RowList<Array<FetchServerVersionResult>>;

  return response[0].server_version;
}
