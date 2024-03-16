import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { dialects } from "./dialects.js";
import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

export async function getDialectId() {
  const seedConfig = await getSeedConfig();
  const driverId = seedConfig.databaseClient.driver;

  if (Object.keys(dialects.postgres.drivers).includes(driverId)) {
    return "postgres";
  }

  if (Object.keys(dialects.sqlite.drivers).includes(driverId)) {
    return "sqlite";
  }

  throw new Error(`Unknown dialect from driver: ${driverId}`);
}

export async function getDialect() {
  const dialectId = await getDialectId();

  switch (dialectId) {
    case "postgres":
      return postgresDialect;
    case "sqlite":
      return sqliteDialect;
  }
}
