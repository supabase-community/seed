import { type Driver } from "./drivers.js";
import { postgresDrivers } from "./postgres/drivers/index.js";
import { sqliteDrivers } from "./sqlite/drivers/index.js";
import { type Dialect } from "./types.js";

export function getDialect(driver: Driver): Dialect {
  if (Object.keys(postgresDrivers).includes(driver)) {
    return "postgres";
  }

  if (Object.keys(sqliteDrivers).includes(driver)) {
    return "sqlite";
  }

  throw new Error("Unknown dialect");
}
