import { type DetermineShapeFromType } from "../../core/dialect/types.js";

export const determineShapeFromType: DetermineShapeFromType = (type: string) =>
  type.toLowerCase() === "text" ? null : "__DEFAULT";
