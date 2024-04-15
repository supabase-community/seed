import { generateConfigTypes } from "#core/dialect/generateConfigTypes.js";
import { type Dialect } from "#core/dialect/types.js";
import { getDatamodel } from "./dataModel.js";
import { determineShapeFromType } from "./determineShapeFromType.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SQL_TEMPLATES } from "./userModels.js";

export const postgresDialect = {
  id: "postgres" as const,
  generateClientTypes,
  generateConfigTypes,
  determineShapeFromType,
  templates: SQL_TEMPLATES,
  getDataModel: getDatamodel,
} satisfies Dialect;
