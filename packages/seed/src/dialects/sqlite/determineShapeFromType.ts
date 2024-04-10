import { type DetermineShapeFromType } from "../../core/dialect/types.js";
import { type SQLiteType } from "./introspect/introspectionToDataModel.js";
import { JS_TO_SQL_TYPES } from "./utils.js";

const STRING_TYPES = new Set(JS_TO_SQL_TYPES.string);

export const determineShapeFromType: DetermineShapeFromType = (
  type: string,
) => {
  const sqliteType = type as SQLiteType;
  // If it's a type string, we wanto to return null to attempt to use our shape inference
  if (STRING_TYPES.has(sqliteType)) {
    return null;
  }
  return "__DEFAULT";
};
