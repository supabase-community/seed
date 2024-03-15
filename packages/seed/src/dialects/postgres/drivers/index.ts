import { nodePostgresDriver } from "./node-postgres.js";
import { postgresJsDriver } from "./postgres-js.js";

export const postgresDrivers = {
  [nodePostgresDriver.name]: nodePostgresDriver,
  [postgresJsDriver.name]: postgresJsDriver,
};
