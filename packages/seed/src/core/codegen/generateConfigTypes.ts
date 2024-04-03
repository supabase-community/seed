import { EOL } from "node:os";
import { SELECT_WILDCARD_STRING } from "#config/seedConfig/selectConfig.js";
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

export function generateSelectTypeFromTableIds(
  tableIds: Array<string>,
): string {
  const uniqueTableIds = Array.from(new Set(tableIds));

  const wildcardPatterns = `\`\${string}${SELECT_WILDCARD_STRING}\` | \`${SELECT_WILDCARD_STRING}\${string}\` | \`${SELECT_WILDCARD_STRING}\${string}${SELECT_WILDCARD_STRING}\``;

  let selectOptions: string;
  if (uniqueTableIds.length > 0) {
    selectOptions = [
      `type TablesOptions = ${EOL}${uniqueTableIds.map((id) => `  "${id}"`).join(` |${EOL}`)}`,
      `type SelectOptions = TablesOptions | ${wildcardPatterns}`,
    ].join(EOL);
  } else {
    selectOptions = `type SelectOptions = ${wildcardPatterns}`;
  }

  return [
    `//#region selectTypes`,
    `type PartialRecord<K extends keyof any, T> = {
      [P in K]?: T;
  };`,
    selectOptions,
    `type SelectConfig = PartialRecord<SelectOptions, boolean>`,
    `//#endregion`,
  ].join(EOL);
}

function generateSelectTypes(dataModel: DataModel): string {
  const tableIdsSet = new Set<string>();
  for (const model of Object.values(dataModel.models)) {
    tableIdsSet.add(model.id);
  }
  const tableIds = Array.from(tableIdsSet);
  return generateSelectTypeFromTableIds(tableIds);
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
    (modelName) => `  ${escapeKey(modelName)}?: {
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
  /**
   * Apply a global renaming strategy to all tables and columns in the generated Seed Client.
   *
   * When \`true\`, a default strategy is applied:
   *
   * - **Model names:** pluralized and camelCased.
   * - **Scalar field names:** camelCased.
   * - **Parent field names (one to one relationships):** singularized and camelCased.
   * - **Child field names (one to many relationships):** pluralized and camelCased.
   * - We also support prefix extraction and opposite baseName for foreign keys inspired by [PostGraphile](https://github.com/graphile/pg-simplify-inflector#naming-your-foreign-key-fields).
   *
   * @example
   * \`\`\`ts seed.client.ts
   * import { defineConfig } from "@snaplet/seed/config";
   *
   * export default defineConfig({
   *   alias: {
   *     inflection: true,
   *   },
   * });
   * \`\`\`
   */
  inflection?: Inflection | boolean;
  /**
   * Rename specific tables and columns in the generated Seed Client.
   * This option is useful for resolving renaming conflicts that can arise when using \`alias.inflection\`.
   *
   * @example
   * \`\`\`ts seed.client.ts
   * import { defineConfig } from "@snaplet/seed/config";
   *
   * export default defineConfig({
   *   alias: {
   *     override: {
   *       Book: {
   *         name: "books",
   *         fields: {
   *           User: "author",
   *           published_at: "publishedAt",
   *         },
   *       },
   *     },
   *   },
   * });
   * \`\`\`
   */
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
  count?: number | { min?: number; max?: number };
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
    (modelName) => `  ${escapeKey(modelName)}?: {
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
   * The database adapter to use.
   *
   * @example
   * \`\`\`ts seed.config.ts
   * import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
   * import { defineConfig } from "@snaplet/seed/config";
   * import postgres from "postgres";
   *
   * export default defineConfig({
   *   adapter: () => {
   *     const client = postgres(process.env.DATABASE_URL);
   *     return new SeedPostgres(client);
   *   },
   * });
   * \`\`\`
   *
   * To learn more about the available adapters, see the [Adapters](https://docs.snaplet.dev/seed/reference/adapters) reference.
   */
  adapter: () => import("@snaplet/seed/adapter").DatabaseClient | Promise<import("@snaplet/seed/adapter").DatabaseClient>;
  /**
   * Customize fields and relationships names.
   */
  alias?: Alias;
  /**
   * Customize the fingerprinting.
   */
  fingerprint?: Fingerprint;
  /**
   * Exclude tables from the generated Seed Client.
   * For excluding multiple tables at once, you can use a wildcard character \`*\` at the end of the table name.
   *
   * @example
   * \`\`\`ts seed.client.ts
   * import { defineConfig } from "@snaplet/seed/config";
   *
   * export default defineConfig({
   *   select: {
   *     "archive*": false,
   *     "access_logs": false,
   *     "auth.*": false,
   *   },
   * });
   * \`\`\`
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
    generateSelectTypes(rawDataModel),
    generateDefineConfigTypes(),
  ].join(EOL);
}
