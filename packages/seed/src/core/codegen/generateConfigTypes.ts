import { EOL } from "node:os";
import { SELECT_WILDCARD_STRING } from "../../config/seedConfig/selectConfig.js";
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

function generateSelectTypes(dataModel: DataModel): string {
  const tableIdsSet = new Set<string>();
  for (const model of Object.values(dataModel.models)) {
    tableIdsSet.add(model.id);
  }
  const tableIds = Array.from(tableIdsSet);
  return [
    `//#region types`,
    `type PartialRecord<K extends keyof unknown, T> = {
      [P in K]?: T;
  };`,
    tableIds.length > 0
      ? `type TablesOptions = \n${tableIds.map((id) => `\t"${id}"`).join(" |\n")}\ntype SelectOptions = TablesOptions | \`\${string}${SELECT_WILDCARD_STRING}\``
      : `type SelectOptions = \`\${string}${SELECT_WILDCARD_STRING}\``,
    `type SelectConfig = PartialRecord<SelectOptions, boolean>`,
    `//#endregion`,
  ].join("\n");
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

function generateDefineConfigTypes() {
  return `
type TypedConfig = {
  /**
   * Parameter to customize fields and relationships names.
   * {@link https://docs.snaplet.dev/core-concepts/seed}
   */
  alias?: import("./snaplet-client").Alias;
  /**
   * Parameter to customize the fingerprinting.
   * {@link https://docs.snaplet.dev/core-concepts/seed}
   */
  fingerprint?: import("./snaplet-client").Fingerprint;
  /**
   * Parameter to configure the inclusion/exclusion of schemas and tables from the seeds.
   * {@link https://docs.snaplet.dev/reference/configuration#select}
   */
    select?: SelectConfig;
  };

  export function defineConfig(
    config: TypedConfig
  ): TypedConfig;`;
}

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
    generateSelectTypes(dataModel),
    generateDefineConfigTypes(),
  ].join(EOL);
}
