import { type DialectId } from "./dialects.js";
import { type DriverId } from "./drivers.js";
import { postgresDialect } from "./postgres/dialect.js";
import { postgresDrivers } from "./postgres/drivers/index.js";
import { sqliteDialect } from "./sqlite/dialect.js";
import { sqliteDrivers } from "./sqlite/drivers/index.js";

export function getDialectFromDriverId(driver: DriverId) {
  if (Object.keys(postgresDrivers).includes(driver)) {
    return postgresDialect;
  }

  if (Object.keys(sqliteDrivers).includes(driver)) {
    return sqliteDialect;
  }

  throw new Error(`No dialect found for driver '${driver}'`);
}

export function getDialect(dialectId: DialectId) {
  switch (dialectId) {
    case "postgres":
      return postgresDialect;
    case "sqlite":
      return sqliteDialect;
  }
}
