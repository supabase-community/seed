import { betterSqlite3Driver } from "./better-sqlite3/better-sqlite3.js";

export const sqliteDrivers = {
  [betterSqlite3Driver.id]: betterSqlite3Driver,
};
