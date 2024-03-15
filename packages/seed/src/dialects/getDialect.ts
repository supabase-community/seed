import { type DialectId } from "./dialects.js";
import { getDatabaseClient } from "./getDatabaseClient.js";
import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

export async function getDialect() {
  const databaseClient = await getDatabaseClient();
  return getDialectById(databaseClient.dialect);
}

export function getDialectById(dialectId: DialectId) {
  switch (dialectId) {
    case "postgres":
      return postgresDialect;
    case "sqlite":
      return sqliteDialect;
  }
}
