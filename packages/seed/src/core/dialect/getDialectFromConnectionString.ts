import { getDialect } from "./getDialect.js";
import { type Dialect } from "./types.js";

export const getDialectFromDatabaseUrl = (
  databaseUrl: string,
): Promise<Dialect> => {
  const protocol = new URL(databaseUrl).protocol.slice(0, -1);

  if (protocol === "postgres" || protocol === "postgresql") {
    return getDialect("postgres");
  } else if (protocol === "file") {
    return getDialect("sqlite");
  } else if (protocol === "mysql") {
    throw new Error(`Not implemented yet`);
  } else if (protocol === "libsql") {
    throw new Error(`Not implemented yet`);
  } else {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }
};
