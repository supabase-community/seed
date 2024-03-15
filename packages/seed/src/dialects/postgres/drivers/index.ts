import { nodePostgresDriver } from "./node-postgres/node-postgres.js";
import { postgresJsDriver } from "./postgres-js/postgres-js.js";

export const postgresDrivers = {
  [nodePostgresDriver.id]: nodePostgresDriver,
  [postgresJsDriver.id]: postgresJsDriver,
};
