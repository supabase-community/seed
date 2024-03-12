import { type Dialect } from "#core/dialect/types.js";
import { getDatamodel } from "./dataModel.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SEED_SQLITE_TEMPLATES } from "./userModels.js";
import { withDbClient } from "./withDbClient.js";

export const dialect: Dialect = {
  generateClientTypes,
  determineShapeFromType: () => null,
  templates: SEED_SQLITE_TEMPLATES,
  withDbClient,
  getDataModel: getDatamodel,
};
