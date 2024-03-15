export interface DataModel {
  enums: Record<string, DataModelEnum>;
  models: Record<string, DataModelModel>;
}

interface DataModelEnum {
  schemaName?: string;
  values: Array<{ name: string }>;
}

export interface DataModelModel {
  fields: Array<DataModelField>;
  id: string;
  schemaName?: string;
  tableName: string;
  uniqueConstraints: Array<DataModelUniqueConstraint>;
}

export interface DataModelUniqueConstraint {
  fields: Array<string>;
  name: string;
}

export interface DataModelSequence {
  current: number;
  identifier: null | string;
  increment: number;
}

export type DataModelField = DataModelObjectField | DataModelScalarField;

export type DataModelObjectField = DataModelCommonFieldProps & {
  kind: "object";
  relationFromFields: Array<string>;
  relationName: string;
  relationToFields: Array<string>;
};

export type DataModelScalarField = DataModelCommonFieldProps & {
  columnName: string;
  id: string;
  kind: "scalar";
  maxLength?: null | number;
};

interface DataModelCommonFieldProps {
  hasDefaultValue: boolean;
  isGenerated: boolean;
  isId: boolean;
  isList: boolean;
  isRequired: boolean;
  name: string;
  sequence: DataModelSequence | false;
  type: string;
}
