import {
  getDataModelConfig,
  getDataModelConfigPath,
} from "#config/dataModelConfig.js";
import { getDotSnapletPath } from "#config/dotSnaplet.js";
import { SnapletError } from "#core/utils.js";
import { getSeedConfig } from "../../config/seedConfig/seedConfig.js";
import { getAliasedDataModel } from "./aliases.js";
import { getSelectFilteredDataModel } from "./select.js";
import {
  type DataModel,
  type DataModelField,
  type DataModelObjectField,
} from "./types.js";

export function isParentField(
  field: DataModelField,
): field is DataModelObjectField {
  return field.kind === "object" && field.relationFromFields.length > 0;
}

export function isPartOfRelation(
  dataModel: DataModel,
  model: string,
  fieldName: string,
) {
  const relations = dataModel.models[model].fields.filter(isParentField);
  return relations.some((relation) =>
    relation.relationFromFields.includes(fieldName),
  );
}

export function isUniqueField(
  dataModel: DataModel,
  model: string,
  fieldName: string,
) {
  return dataModel.models[model].uniqueConstraints.some(
    (uc) => uc.fields.length === 1 && uc.fields.includes(fieldName),
  );
}

export function isNullableParent(
  dataModel: DataModel,
  model: string,
  fieldName: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const field = dataModel.models[model].fields.find(
    (f) => f.name === fieldName,
  )!;

  return (
    !field.isRequired &&
    dataModel.models[model].fields.some(
      (f) => f.kind === "object" && f.relationFromFields.includes(fieldName),
    )
  );
}

export async function getRawDataModel() {
  const dataModel = await getDataModelConfig();
  if (dataModel === null) {
    const dataModelConfigPath = await getDataModelConfigPath();
    const dotSnapletPath = await getDotSnapletPath();
    throw new SnapletError("SEED_DATA_MODEL_NOT_FOUND", {
      path: dataModelConfigPath ?? dotSnapletPath,
    });
  }
  return dataModel;
}

export async function getFilteredDataModel() {
  const dataModelConfig = await getRawDataModel();

  const snapletConfig = await getSeedConfig();

  return getSelectFilteredDataModel(dataModelConfig, snapletConfig.select);
}

export async function getDataModel() {
  const dataModelConfig = await getRawDataModel();

  const snapletConfig = await getSeedConfig();

  const filteredDataModel = getSelectFilteredDataModel(
    dataModelConfig,
    snapletConfig.select,
  );

  return getAliasedDataModel(filteredDataModel, snapletConfig.alias);
}
