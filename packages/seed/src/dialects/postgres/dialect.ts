import { type Dialect } from "#core/dialect/types.js";
import { determineShapeFromType } from "./determineShapeFromType.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SEED_PG_TEMPLATES } from "./userModels.js";

export const dialect: Dialect = {
  generateClientTypes,
  determineShapeFromType,
  templates: SEED_PG_TEMPLATES,
};
