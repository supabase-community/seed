import { getDataModelConfig } from "#config/dataModelConfig.js";
import { getSnapletConfig } from "../../config/seedConfig/snapletConfig.js";
import { getAliasedDataModel } from "./aliases.js";
import {
  type DataModel,
  type DataModelField,
  type DataModelObjectField,
  type DataModelScalarField,
} from "./types.js";

export function groupFields(fields: Array<DataModelField>) {
  const groupedFields = {
    scalars: [] as Array<DataModelScalarField>,
    parents: [] as Array<DataModelObjectField>,
    children: [] as Array<DataModelObjectField>,
  };

  for (const field of fields) {
    if (field.kind === "scalar") {
      groupedFields.scalars.push(field);
    } else if (field.relationFromFields.length > 0) {
      groupedFields.parents.push(field);
    } else if (field.relationFromFields.length === 0) {
      groupedFields.children.push(field);
    }
  }

  return groupedFields;
}

export function isParentField(
  field: DataModelField,
): field is DataModelObjectField {
  return field.kind === "object" && field.relationFromFields.length > 0;
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

export async function getDataModel() {
  const dataModelConfig = await getDataModelConfig();

  if (dataModelConfig === null) {
    // TODO: Add a better error
    throw new Error(
      "DataModel not found. Please run `snaplet introspect` to generate it.",
    );
  }

  const snapletConfig = await getSnapletConfig();

  return getAliasedDataModel(dataModelConfig, snapletConfig?.alias);
}
