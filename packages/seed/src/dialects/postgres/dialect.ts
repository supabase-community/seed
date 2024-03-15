import { type Dialect } from "#core/dialect/types.js";
import { getDatamodel } from "./dataModel.js";
import { determineShapeFromType } from "./determineShapeFromType.js";
import { postgresDrivers } from "./drivers/index.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SEED_PG_TEMPLATES } from "./userModels.js";

export const postgresDialect = {
  id: "postgres" as const,
  generateClientTypes,
  determineShapeFromType,
  templates: SEED_PG_TEMPLATES,
  getDataModel: getDatamodel,
  drivers: postgresDrivers,
} satisfies Dialect;
