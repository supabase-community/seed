import { getDatabaseClient } from "#adapters/getDatabaseClient.js";
import { getDataModelConfig } from "#config/dataModelConfig.js";
import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

async function getDialectId() {
  const dataModelConfig = await getDataModelConfig();

  if (dataModelConfig) {
    return dataModelConfig.dialect;
  }

  const databaseClient = await getDatabaseClient();

  return databaseClient.dialect;
}

export async function getDialect() {
  const dialectId = await getDialectId();

  switch (dialectId) {
    case "postgres":
      return postgresDialect;
    case "sqlite":
      return sqliteDialect;
    case "mysql":
      return;
  }
}
