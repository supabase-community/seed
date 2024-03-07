import { type DataModel } from "../dataModel/types.js";
import { type Dialect } from "./types.js";

export const getDialect = async (
  dialect: DataModel["dialect"],
): Promise<Dialect> => {
  switch (dialect) {
    case "postgres":
      return (await import("#dialects/postgres/dialect.js")).dialect;
    case "sqlite":
      return (await import("#dialects/sqlite/dialect.js")).dialect;
    default:
      throw new Error(`No dialect context found for dialect '${dialect}'`);
  }
};
