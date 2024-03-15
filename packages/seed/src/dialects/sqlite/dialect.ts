import { type Dialect } from "#core/dialect/types.js";
import { getDatamodel } from "./dataModel.js";
import { sqliteDrivers } from "./drivers/index.js";
import { generateClientTypes } from "./generateClientTypes.js";
import { SEED_SQLITE_TEMPLATES } from "./userModels.js";

export const sqliteDialect = {
  id: "sqlite" as const,
  generateClientTypes,
  determineShapeFromType: () => null,
  templates: SEED_SQLITE_TEMPLATES,
  getDataModel: getDatamodel,
  drivers: sqliteDrivers,
} satisfies Dialect;
