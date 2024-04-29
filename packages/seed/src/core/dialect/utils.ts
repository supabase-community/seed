import { flat } from "remeda";
import { type DetermineShapeFromType } from "./types.js";

const isNestedArraySQLType = (SQLType: string): boolean =>
  SQLType.startsWith("_") || SQLType.endsWith("[]");

const JS_TO_SQL_TYPES = {
  string: [
    "char",
    "bpchar",
    "character_data",
    "varchar",
    "text",
    "character",
    "character varying",
    "inet",
    "cidr",
    "point",
    "lseg",
    "path",
    "box",
    "line",
    "circle",
    "macaddr",
    "macaddr8",
    "interval",
    "tsquery",
    "tsvector",
    "pg_lsn",
    "xml",
    "bit",
    "varbit",
    "bit varying",
    "uuid",
    "bytea",
    "money",
    "smallmoney",
    "datetime",
    "timestamp",
    "date",
    "time",
    "timetz",
    "timestamptz",
    "datetime2",
    "smalldatetime",
    "datetimeoffset",
    "citext",
  ] as const,
  number: [
    "tinyint",
    "int",
    "numeric",
    "integer",
    "real",
    "smallint",
    "decimal",
    "float",
    "float4",
    "float8",
    "double precision",
    "double",
    "dec",
    "fixed",
    "year",
    "smallserial",
    "serial",
    "serial2",
    "serial4",
    "serial8",
    "bigserial",
    "int2",
    "int4",
    "int8",
    "int16",
    "int32",
    "bigint",
  ] as const,
  boolean: ["boolean", "bool"] as const,
  Json: ["json", "jsonb"] as const,
  Buffer: [
    "binary",
    "varbinary",
    "image",
    "blob",
    "bytea",
    "tinyblob",
    "mediumblob",
    "longblob",
  ] as const,
} as const;
export const SQL_TYPES_LIST = Object.values(JS_TO_SQL_TYPES).flat();
type JsToSQLTypes = typeof JS_TO_SQL_TYPES;
type NonNullableJsTypeName = keyof JsToSQLTypes;
export type JsTypeName = "null" | NonNullableJsTypeName;
export type SQLTypeName = JsToSQLTypes[NonNullableJsTypeName][number];

export const SQL_TO_JS_TYPES: Record<SQLTypeName, JsTypeName> =
  Object.fromEntries(
    flat(
      Object.entries(JS_TO_SQL_TYPES).map(([jsType, SQLTypes]) =>
        SQLTypes.map((SQLType) => [SQLType, jsType]),
      ),
    ),
  ) as Record<SQLTypeName, JsTypeName>;

export const extractPrimitiveSQLType = (SQLType: string): SQLTypeName => {
  if (isNestedArraySQLType(SQLType)) {
    if (SQLType.startsWith("_")) {
      return SQLType.slice(1) as SQLTypeName;
    } else {
      return SQLType.replaceAll("[]", "") as SQLTypeName;
    }
  }

  return SQLType as SQLTypeName;
};

export const escapeIdentifier = function (str: string) {
  return '"' + str.replace(/"/g, '""') + '"';
};

export const escapeLiteral = function (str: string) {
  var hasBackslash = false;
  var escaped = "'";

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c === "'") {
      escaped += c + c;
    } else if (c === "\\") {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }

  escaped += "'";

  if (hasBackslash) {
    escaped = " E" + escaped;
  }

  return escaped;
};

export const SQL_DATE_TYPES = new Set<SQLTypeName>([
  "datetime",
  "timestamp",
  "date",
  "timestamptz",
  "datetime2",
  "smalldatetime",
  "datetimeoffset",
]);

export const SQL_JSON_TYPES = new Set<SQLTypeName>(["json", "jsonb"]);

export const SQL_NUMBER_TYPES = new Set<SQLTypeName>([
  "tinyint",
  "int",
  "numeric",
  "integer",
  "real",
  "smallint",
  "decimal",
  "float",
  "float4",
  "float8",
  "double precision",
  "double",
  "dec",
  "fixed",
  "year",
  "smallserial",
  "serial",
  "serial2",
  "serial4",
  "serial8",
  "bigserial",
  "int2",
  "int4",
  "int8",
  "int16",
  "int32",
  "bigint",
]);

type SQLStringTypes = (typeof JS_TO_SQL_TYPES.string)[number];

// Contain all string types that will be otherswise tranformed using
// #core/userModels/templates/categories/strings.js values
export const LLM_PREDICTABLE_TYPES = new Set<SQLStringTypes>([
  "bpchar",
  "character",
  "character varying",
  "character_data",
  "varchar",
  "citext",
  "text",
]);

// All the types tranformations that might be improved thank's to shape
// recognition (eg: LATITUDE -> float, EMAIL -> text, ...)
const SHAPES_IMPROVABLES_TYPES = new Set<SQLTypeName>([
  ...LLM_PREDICTABLE_TYPES,
]);

export const determineShapeFromType: DetermineShapeFromType = (
  type: string,
) => {
  // If the type is a free text field we want to determine the shape and examples by using the LLM
  if (SHAPES_IMPROVABLES_TYPES.has(type)) {
    return null;
  }
  // Otherwise we'll use the default shape per type as defined in the DEFAULT_SQL_TEMPLATES
  return "__DEFAULT";
};

export function groupBy<T, K extends number | string | symbol>(
  array: Array<T>,
  getKey: (item: T) => K,
) {
  const result: Record<K, Array<T> | undefined> = {} as Record<
    K,
    Array<T> | undefined
  >;
  return array.reduce((accumulator, currentItem) => {
    const key = getKey(currentItem);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key]?.push(currentItem);
    return accumulator;
  }, result);
}
