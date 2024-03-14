import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { type DrizzleDbClient } from "#core/adapters.js";
import { DrizzleORMNodePostgresClient } from "./node-postgres.js";
import { DrizzleORMPostgresJsClient } from "./postgres-js.js";

type PgAdapterName =
  | "NeonHttpSession"
  | "NeonSession"
  | "NodePgSession"
  | "PostgresJsSession";

export function createDrizzleORMPgClient(
  db: PgDatabase<QueryResultHKT>,
): DrizzleDbClient {
  // @ts-expect-error - we need to use the drizzle internal adapter session name to determine the adapter
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const sessionName = db.session.constructor.name as PgAdapterName;
  switch (sessionName) {
    case "PostgresJsSession":
      return new DrizzleORMPostgresJsClient(db);
    case "NodePgSession":
    case "NeonHttpSession":
    case "NeonSession":
      return new DrizzleORMNodePostgresClient(db);
  }
}
