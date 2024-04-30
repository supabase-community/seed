import SqlString from "sqlstring";
import { type Serializable } from "#core/data/types.js";
import { SQL_DATE_TYPES } from "./utils.js";

export * from "#core/dialect/utils.js";

export const escapeIdentifier = (value: string | undefined) =>
  SqlString.escapeId(value);
export const escapeLiteral = SqlString.escape;

export const serializeToSQL = (type: string, value: Serializable) => {
  if (value === null) {
    return "NULL";
  }
  if (SQL_DATE_TYPES.has(type)) {
    return escapeLiteral(new Date(value as string));
  }
  return escapeLiteral(value);
};

export const formatValues = (values: Array<Array<unknown>>) => {
  return values.map((row) => `(${row.map((v) => v).join(", ")})`).join(", ");
};
