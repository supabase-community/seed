import { type DetermineShapeFromType } from "#core/dialect/types.js";
import { unpackNestedType } from "#core/dialect/unpackNestedType.js";
import { JS_TO_SQL_TYPES } from "./utils.js";

const PG_GEOMETRY_TYPES = new Set([
  "point",
  "line",
  "lseg",
  "box",
  "path",
  "circle",
]);

const STRING_TYPES = new Set(JS_TO_SQL_TYPES.string);

export const determineShapeFromType: DetermineShapeFromType = (
  wrappedType: string,
) => {
  const [type] = unpackNestedType(wrappedType);

  // Return deterministic shapes based on type
  if (type === "uuid") {
    return "UUID";
  }
  if (new Set(["macaddr", "macaddr8"]).has(type)) {
    return "MAC_ADDRESS";
  }
  if (new Set(["cidr", "inet"]).has(type)) {
    return "IP_ADDRESS";
  }

  if (PG_GEOMETRY_TYPES.has(type)) {
    return "__DEFAULT";
  }

  if (!STRING_TYPES.has(type)) {
    return "__DEFAULT";
  }

  return null;
};
