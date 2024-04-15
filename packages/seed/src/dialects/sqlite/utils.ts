import { type Serializable } from "#core/data/types.js";
import {
  SQL_TO_JS_TYPES,
  extractPrimitiveSQLType,
} from "#core/dialect/utils.js";
import { jsonStringify } from "#core/utils.js";

export * from "#core/dialect/utils.js";

export const serializeToSQL = (type: string, value: Serializable) => {
  const jsType = SQL_TO_JS_TYPES[extractPrimitiveSQLType(type)];

  if (["json", "jsonb"].includes(type)) {
    return jsonStringify(value);
  }

  if (jsType === "boolean") {
    return value ? 1 : 0;
  }

  // SQLite does not automatically convert string to buffers when inserting into a BLOB column
  // we need to manually ensure that the value is converted to a buffer so that it can be inserted using X'' syntax
  if (jsType === "Buffer" && value && !(value instanceof Buffer)) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return Buffer.from(value.toString());
  }

  return value;
};
