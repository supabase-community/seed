import { EOL } from "node:os";
import { type DataModel, type DataModelField } from "../dataModel/types.js";
import { escapeKey } from "../utils.js";

type ComputeFingerprintFieldTypeName = (
  field: DataModelField,
) =>
  | "FingerprintDateField"
  | "FingerprintJsonField"
  | "FingerprintNumberField"
  | "FingerprintRelationField"
  | null;

export function generateConfigTypes(props: {
  computeFingerprintFieldTypeName: ComputeFingerprintFieldTypeName;
  dataModel: DataModel;
  rawDataModel?: DataModel;
}) {
  const {
    dataModel,
    rawDataModel = dataModel,
    computeFingerprintFieldTypeName,
  } = props;
  return [
    generateAliasTypes(rawDataModel),
    generateFingerprintTypes({ dataModel, computeFingerprintFieldTypeName }),
  ].join(EOL);
}

function generateAliasTypes(dataModel: DataModel) {
  const inflection = `type ScalarField = {
  name: string;
  type: string;
};
type ObjectField = ScalarField & {
  relationFromFields: string[];
  relationToFields: string[];
};
type Inflection = {
  modelName?: (name: string) => string;
  scalarField?: (field: ScalarField) => string;
  parentField?: (field: ObjectField, oppositeBaseNameMap: Record<string, string>) => string;
  childField?: (field: ObjectField, oppositeField: ObjectField, oppositeBaseNameMap: Record<string, string>) => string;
  oppositeBaseNameMap?: Record<string, string>;
};`;

  const override = `type Override = {
${Object.keys(dataModel.models)
  .map(
    (modelName) => `  ${modelName}?: {
    name?: string;
    fields?: {
${dataModel.models[modelName].fields
  .map((f) => `      ${escapeKey(f.name)}?: string;`)
  .join(EOL)}
    };
  }`,
  )
  .join(EOL)}}`;

  const alias = `export type Alias = {
  inflection?: Inflection | boolean;
  override?: Override;
};`;

  return [inflection, override, alias].join(EOL);
}

function generateFingerprintTypes(props: {
  computeFingerprintFieldTypeName: ComputeFingerprintFieldTypeName;
  dataModel: DataModel;
}) {
  const { dataModel, computeFingerprintFieldTypeName } = props;
  const relationField = `interface FingerprintRelationField {
  count?: number | MinMaxOption;
}`;
  const jsonField = `interface FingerprintJsonField {
  schema?: any;
}`;
  const dateField = `interface FingerprintDateField {
  options?: {
    minYear?: number;
    maxYear?: number;
  }
}`;
  const numberField = `interface FingerprintNumberField {
  options?: {
    min?: number;
    max?: number;
  }
}`;
  const fingerprint = `export interface Fingerprint {
${Object.keys(dataModel.models)
  .map(
    (modelName) => `  ${modelName}?: {
${dataModel.models[modelName].fields
  .map((f) => {
    const fieldType = computeFingerprintFieldTypeName(f);

    if (fieldType === null) {
      return null;
    }

    return `    ${escapeKey(f.name)}?: ${fieldType};`;
  })
  .filter(Boolean)
  .join(EOL)}
  }`,
  )
  .join(EOL)}}`;

  return [relationField, jsonField, dateField, numberField, fingerprint].join(
    EOL,
  );
}
