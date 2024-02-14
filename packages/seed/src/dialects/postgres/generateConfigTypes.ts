import { generateConfigTypes as _generateConfigTypes } from "#core/codegen/generateConfigTypes.js";
import { type DataModel, type DataModelField } from "#core/dataModel/types.js";
import { PG_DATE_TYPES, PG_JSON_TYPES, PG_NUMBER_TYPES } from "./utils.js";

export function generateConfigTypes(props: {
  dataModel: DataModel;
  rawDataModel?: DataModel;
}) {
  return _generateConfigTypes({
    ...props,
    computeFingerprintFieldTypeName,
  });
}

function computeFingerprintFieldTypeName(field: DataModelField) {
  if (field.kind === "object") {
    return "FingerprintRelationField";
  }

  if (PG_JSON_TYPES.has(field.type)) {
    return "FingerprintJsonField";
  }

  if (PG_DATE_TYPES.has(field.type)) {
    return "FingerprintDateField";
  }

  if (PG_NUMBER_TYPES.has(field.type)) {
    return "FingerprintNumberField";
  }

  return null;
}
