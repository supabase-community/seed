import { DataModelField, DataModelObjectField, DataModelScalarField } from "./types.js"

export function groupFields(fields: DataModelField[]) {
  const groupedFields = {
    scalars: [] as DataModelScalarField[],
    parents: [] as DataModelObjectField[],
    children: [] as DataModelObjectField[],
  }

  for (const field of fields) {
    if (field.kind === 'scalar') {
      groupedFields.scalars.push(field)
    } else if (field.kind === 'object' && field.relationFromFields.length > 0) {
      groupedFields.parents.push(field)
    } else if (
      field.kind === 'object' &&
      field.relationFromFields.length === 0
    ) {
      groupedFields.children.push(field)
    }
  }

  return groupedFields
}

export function isParentField(
  field: DataModelField
): field is DataModelObjectField {
  return field.kind === 'object' && field.relationFromFields.length > 0
}