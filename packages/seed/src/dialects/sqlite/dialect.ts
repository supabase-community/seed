import { type Dialect } from "#core/dialect/types.js";
import { getDatamodel } from "./dataModel.js";
import { determineShapeFromType } from "./determineShapeFromType.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { generateConfigTypes } from "./generateConfigTypes.js";
import { SEED_SQLITE_TEMPLATES } from "./userModels.js";

export const sqliteDialect = {
  id: "sqlite" as const,
  generateClientTypes,
  generateConfigTypes,
  determineShapeFromType,
  templates: SEED_SQLITE_TEMPLATES,
  getDataModel: getDatamodel,
} satisfies Dialect;
