import { type Shape } from "#trpc/shapes.js";
import { unpackNestedType } from "../../core/dialect/unpackNestedType.js";

const PG_GEOMETRY_TYPES = new Set([
  "point",
  "line",
  "lseg",
  "box",
  "path",
  "circle",
]);

export const determineShapeFromType = (
  wrappedType: string,
): "__DEFAULT" | Shape | null => {
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

  return null;
};
