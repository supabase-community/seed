import { postgresDialect } from "./postgres/dialect.js";
import { sqliteDialect } from "./sqlite/dialect.js";

const dialects = {
  [postgresDialect.id]: postgresDialect,
  [sqliteDialect.id]: sqliteDialect,
};

export type DialectId = keyof typeof dialects;
