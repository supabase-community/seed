import { type DetermineShapeFromType } from "../../core/dialect/types.js";
import { type SQLiteType } from "./introspect/introspectionToDataModel.js";

export const determineShapeFromType: DetermineShapeFromType = (
  type: string,
) => {
  const sqliteType = type as SQLiteType;
  return sqliteType === "text" || sqliteType === "integer" ? null : "__DEFAULT";
};
