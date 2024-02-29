import {
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
