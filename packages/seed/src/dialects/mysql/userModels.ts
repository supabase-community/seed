import { DEFAULT_SQL_TEMPLATES } from "#core/dialect/userModels.js";
import { type Templates } from "#core/userModels/templates/types.js";
import { type SQLTypeName } from "./utils.js";

export const SQL_TEMPLATES: Templates<SQLTypeName> = {
  ...DEFAULT_SQL_TEMPLATES,
};
