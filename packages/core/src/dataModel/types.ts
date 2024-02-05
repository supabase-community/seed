export type DataModel = {
  models: Record<string, DataModelModel>
  enums: Record<string, DataModelEnum>
}

type DataModelEnum = {
  schemaName?: string
  values: { name: string }[]
}

export type DataModelModel = {
  id: string
  schemaName?: string
  tableName: string
  fields: DataModelField[]
  uniqueConstraints: DataModelUniqueConstraint[]
}

export type DataModelUniqueConstraint = {
  name: string
  fields: Array<string>
}

export type DataModelSequence = {
  identifier: string | null
  current: number
  start: number
  increment: number
}

export type DataModelField = DataModelObjectField | DataModelScalarField

export type DataModelObjectField = DataModelCommonFieldProps & {
  kind: 'object'
  relationName: string
  relationFromFields: string[]
  relationToFields: string[]
}

export type DataModelScalarField = DataModelCommonFieldProps & {
  kind: 'scalar'
  id: string
  columnName: string
}

type DataModelCommonFieldProps = {
  name: string
  type: string
  isRequired: boolean
  isGenerated: boolean
  hasDefaultValue: boolean
  isList: boolean
  isId: boolean
  sequence: DataModelSequence | false
}