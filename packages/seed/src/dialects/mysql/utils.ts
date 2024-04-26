import { escape } from "mysql2";
import SqlString from "sqlstring";
import { type Json, type Serializable } from "#core/data/types.js";
import {
  type JsTypeName,
  SQL_TO_JS_TYPES,
  extractPrimitiveSQLType,
} from "#core/dialect/utils.js";
import { jsonStringify } from "#core/utils.js";

export * from "#core/dialect/utils.js";

export const escapeIdentifier = SqlString.escapeId;
export const escaleLiteral = SqlString.escape;
export const format = SqlString.format;

export const isNestedArrayMySQLType = (pgType: string): boolean =>
  pgType.startsWith("_") || pgType.endsWith("[]");

export const getMySQLTypeArrayDimensions = (pgType: string): number => {
  if (pgType.startsWith("_")) {
    return 1;
  }

  return pgType.split("[]").length - 1;
};

type Serializer = (v: Json) => string;

type Serializers = Partial<Record<JsTypeName, Serializer>>;

const SERIALIZERS: Serializers = {
  string: String,
  number: String,
  boolean: (v) => (v ? "t" : "f"),
  Json: (v) => jsonStringify(v),
};

const getSQLTypeArrayDimensions = (SQLType: string): number => {
  if (SQLType.startsWith("_")) {
    return 1;
  }

  return SQLType.split("[]").length - 1;
};

const serializeArrayColumn = (value: Json, SQLType: string): string => {
  const arrayDimension = getSQLTypeArrayDimensions(SQLType);
  const jsType = SQL_TO_JS_TYPES[extractPrimitiveSQLType(SQLType)];

  if (value === null) {
    return "NULL";
  }

  if (arrayDimension === 0 && jsType === "Json") {
    return jsonStringify(jsonStringify(value));
  }

  if (Array.isArray(value)) {
    const openingBracket = arrayDimension > 0 ? "{" : "[";
    const closingBracket = arrayDimension > 0 ? "}" : "]";
    const nextSQLType = arrayDimension > 0 ? SQLType.slice(0, -2) : SQLType;
    return [
      openingBracket,
      value.map((v) => serializeArrayColumn(v, nextSQLType)).join(","),
      closingBracket,
    ].join("");
  }

  const serializer = SERIALIZERS[jsType];

  const result = !serializer ? String(value) : serializer(value);

  return jsType === "string" ? jsonStringify(result) : result;
};

export const serializeToSQL = (type: string, value: Serializable) => {
  if (isNestedArrayMySQLType(type)) {
    return serializeArrayColumn(value as string, type);
  }

  if (["json", "jsonb"].includes(type)) {
    return jsonStringify(value);
  }

  return value;
};

export const formatValues = (values: Array<Array<unknown>>) => {
  return values
    .map((row) => `(${row.map((v) => escape(format(v))).join(", ")})`)
    .join(", ");
};
