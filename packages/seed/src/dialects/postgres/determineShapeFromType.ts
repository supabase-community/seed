import { type DetermineShapeFromType } from "#core/dialect/types.js";
import { unpackNestedType } from "#core/dialect/unpackNestedType.js";
import { determineShapeFromType as _determineShapeFromType } from "#core/dialect/utils.js";

export const determineShapeFromType: DetermineShapeFromType = (
  wrappedType: string,
) => {
  const [type] = unpackNestedType(wrappedType);

  return _determineShapeFromType(type);
};
