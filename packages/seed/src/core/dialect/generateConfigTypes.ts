import {
  generateConfigTypes as _generateConfigTypes,
  type FingerprintTypes,
} from "#core/codegen/generateConfigTypes.js";
import { type DataModel, type DataModelField } from "#core/dataModel/types.js";
import {
  LLM_PREDICTABLE_TYPES,
  SQL_DATE_TYPES,
  SQL_JSON_TYPES,
  SQL_NUMBER_TYPES,
} from "./utils.js";

export function generateConfigTypes(props: {
  dataModel: DataModel;
  rawDataModel?: DataModel;
}) {
  return _generateConfigTypes({
    ...props,
    computeFingerprintFieldTypeName,
  });
}

function computeFingerprintFieldTypeName(
  field: DataModelField,
): FingerprintTypes {
  if (field.kind === "object") {
    return "FingerprintRelationField";
  }

  if (SQL_JSON_TYPES.has(field.type)) {
    return "FingerprintJsonField";
  }

  if (SQL_DATE_TYPES.has(field.type)) {
    return "FingerprintDateField";
  }

  if (SQL_NUMBER_TYPES.has(field.type)) {
    return "FingerprintNumberField";
  }

  if (LLM_PREDICTABLE_TYPES.has(field.type)) {
    return "FingerprintLLMField";
  }

  return null;
}
