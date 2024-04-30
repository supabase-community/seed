import { getAdapter } from "#adapters/getAdapter.js";
import { mysqlDialect } from "./mysql/dialect.js";
import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

async function getDialectId() {
  const adapter = await getAdapter();

  return adapter.getDialect();
}

export async function getDialect() {
  const dialectId = await getDialectId();

  switch (dialectId) {
    case "postgres":
      return postgresDialect;
    case "sqlite":
      return sqliteDialect;
    case "mysql":
      return mysqlDialect;
  }
}
