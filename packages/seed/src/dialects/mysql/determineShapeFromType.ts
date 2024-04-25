import { type DetermineShapeFromType } from "#core/dialect/types.js";
import { determineShapeFromType as _determineShapeFromType } from "#core/dialect/utils.js";

export const determineShapeFromType: DetermineShapeFromType = (
  type: string,
) => {
  return _determineShapeFromType(type);
};
