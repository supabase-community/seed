import { type Dialect } from "#core/dialect/types.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SEED_SQLITE_TEMPLATES } from "./userModels.js";

export const dialect: Dialect = {
  generateClientTypes,
  determineShapeFromType: () => null,
  templates: SEED_SQLITE_TEMPLATES,
};
