import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

export async function getDialectId() {
  const seedConfig = await getSeedConfig();
  const databaseClient = await seedConfig.adapter();

  return databaseClient.dialect;
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
