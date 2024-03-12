import { type Dialect } from "#core/dialect/types.js";
import { getDatamodel } from "./dataModel.js";
import { determineShapeFromType } from "./determineShapeFromType.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SEED_PG_TEMPLATES } from "./userModels.js";
import { withDbClient } from "./withDbClient.js";

export const dialect: Dialect = {
  generateClientTypes,
  determineShapeFromType,
  templates: SEED_PG_TEMPLATES,
  getDataModel: getDatamodel,
  withDbClient,
};
