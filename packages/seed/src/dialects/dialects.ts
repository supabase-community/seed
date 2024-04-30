import { mysqlDialect } from "./mysql/dialect.js";
import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

const dialects = {
  [mysqlDialect.id]: mysqlDialect,
  [postgresDialect.id]: postgresDialect,
  [sqliteDialect.id]: sqliteDialect,
};

export type DialectId = keyof typeof dialects;
