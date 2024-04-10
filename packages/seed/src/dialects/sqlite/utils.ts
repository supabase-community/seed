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

  return value;
};
