import { EOL } from "node:os";
import { groupFields } from "../dataModel/dataModel.js";
import {
  type DataModel,
  type DataModelModel,
  type DataModelObjectField,
  type DataModelScalarField,
} from "../dataModel/types.js";
import {
  isJsonField,
  jsonSchemaToTypescriptType,
} from "../fingerprint/fingerprint.js";
import { type Fingerprint } from "../fingerprint/types.js";
import { escapeKey } from "../utils.js";

type Database2tsType = (
  dataModel: DataModel,
  databaseType: string,
  isRequired: boolean,
) => string;

type IsJson = (databaseType: string) => boolean;

type RefineType = (
  type: string,
  databaseType: string,
  isRequired: boolean,
) => string;

export async function generateClientTypes(props: {
  dataModel: DataModel;
  database2tsType: Database2tsType;
  databaseClientType: string;
  fingerprint?: Fingerprint;
  imports: string;
  isJson: IsJson;
  refineType: RefineType;
}) {
  const { dataModel, fingerprint, imports } = props;
  return [
    imports,
    generateHelpers(),
    generateStoreTypes(dataModel),
    generateEnums(dataModel),
    await generateInputsTypes({
      dataModel,
      fingerprint: fingerprint ?? {},
      database2tsType: props.database2tsType,
      isJson: props.isJson,
      refineType: props.refineType,
    }),
    generateSeedClientBaseTypes(dataModel),
    generateSeedClientTypes(props.databaseClientType),
  ].join(EOL);
}

function generateHelpers() {
  return `type JsonPrimitive = null | number | string | boolean;
type Nested<V> = V | { [s: string]: V | Nested<V> } | Array<V | Nested<V>>;
type Json = Nested<JsonPrimitive>;
type MinMaxOption = { min?: number; max?: number };
type ColumnValueCallbackContext<TScalars> = {
  /**
   * The seed of the field.
   *
   * @example
   * \`\`\`ts
   * "<hash>/0/users/0/email"
   * \`\`\`
   */
  seed: string;

  /**
   * The fields already generated for this model.
   *
   * @example
   * \`\`\`ts
   * { email: "user@example.org" }
   * \`\`\`
   */
  data: Partial<TScalars>;

  /**
   * The store containing models already created in this plan.
   *
   * @example
   * \`\`\`ts
   * { posts: [{ id: 1, authorId: 1 }], authors: [{ id: 1 }] }
   * \`\`\`
   */
  store: Store

  /**
   * The global store containing all models created in this \`snaplet\` instance so far.
   *
   * @example
   * \`\`\`ts
   * { posts: [{ id: 1, authorId: 1 }], authors: [{ id: 1 }] }
   * \`\`\`
   */
  $store: Store

  options: Record<string, unknown> | undefined
};

/**
 * helper type to get the possible values of a scalar field
 */
type ColumnValue<T, TScalars> = T | ((ctx: ColumnValueCallbackContext<TScalars>) => T | Promise<T>);

/**
 * helper type to map a record of scalars to a record of ColumnValue
 */
type MapToColumnValue<T> = { [K in keyof T]: ColumnValue<T[K], T> };

/**
 * Create an array of \`n\` models.
 *
 * Can be read as "Generate \`model\` times \`n\`".
 *
 * @param \`n\` The number of models to generate.
 * @param \`callbackFn\` The \`x\` function calls the \`callbackFn\` function one time for each element in the array.
 *
 * @example Generate 10 users:
 * \`\`\`ts
 * seed.users((x) => x(10));
 * \`\`\`
 *
 * @example Generate 3 projects with a specific name:
 * \`\`\`ts
 * seed.projects((x) => x(3, { name: 'Project Name' }));
 * \`\`\`
 *
 * @example Generate 3 projects with a specific name depending on the index:
 * \`\`\`ts
 * seed.projects((x) => x(3, ({ index }) => ({ name: \`Project \${index}\` })));
 * \`\`\`
 */
declare function xCallbackFn<T>(
  n: number | MinMaxOption,
  callbackFn?: T
): Array<T>;

type ChildCallbackInputs<T> = (
  x: typeof xCallbackFn<T>,
) => Array<T>;

type ChildModelCallback<T> = (ctx: ModelCallbackContext & { index: number }) => T

type ChildModel<T> = T | ChildModelCallback<T>

/**
 * all the possible types for a child field
 */
type ChildInputs<T> = Array<ChildModel<T>> | ChildCallbackInputs<ChildModel<T>>;

/**
 * omit some keys TKeys from a child field
 * @example we remove ExecTask from the Snapshot child field values as we're coming from ExecTask
 * type ExecTaskChildrenInputs = {
 *   Snapshot: OmitChildInputs<SnapshotChildInputs, "ExecTask">;
 * };
 */
type OmitChildInputs<T, TKeys extends string> = T extends ChildCallbackInputs<ChildModel<
  infer U
>>
  ? ChildCallbackInputs<ChildModel<Omit<U, TKeys>>>
  : T extends Array<ChildModel<infer U>>
  ? Array<ChildModel<Omit<U, TKeys>>>
  : never;

type ConnectCallbackContext = {
  /**
   * The index of the current iteration.
   */
  index: number;

  /**
   * The seed of the relationship field.
   */
  seed: string;

  /**
   * The store containing models already created in this plan.
   *
   * @example
   * \`\`\`ts
   * { posts: [{ id: 1, authorId: 1 }], authors: [{ id: 1 }] }
   * \`\`\`
   */
  store: Store

  /**
   * The global store containing all models created in this \`snaplet\` instance so far.
   *
   * @example
   * \`\`\`ts
   * { posts: [{ id: 1, authorId: 1 }], authors: [{ id: 1 }] }
   * \`\`\`
   */
  $store: Store
};

/**
 * the callback function we can pass to a parent field to connect it to another model
 * @example
 * seed.posts([({ connect }) => ({ user: connect((ctx) => ({ id: ctx.store.User[0] })) }))
 */
type ConnectCallback<T> = (
  ctx: ConnectCallbackContext
) => T;

type ModelCallbackContextConnect<T> =  (cb: ConnectCallback<T>) => Connect<T>

type ModelCallbackContext = {
  /**
   * The seed of the model.
   */
  seed: string;

  /**
   * The store containing models already created in this plan.
   *
   * @example
   * \`\`\`ts
   * { posts: [{ id: 1, authorId: 1 }], authors: [{ id: 1 }] }
   * \`\`\`
   */
  store: Store

  /**
   * The global store containing all models created in this \`snaplet\` instance so far.
   *
   * @example
   * \`\`\`ts
   * { posts: [{ id: 1, authorId: 1 }], authors: [{ id: 1 }] }
   * \`\`\`
   */
  $store: Store
}

type ModelCallback<T> = (ctx: ModelCallbackContext) => T

type ParentModelCallback<T, TScalars> = (ctx: ModelCallbackContext & {
  connect: ModelCallbackContextConnect<TScalars>
}) => T | Connect<TScalars>

type ParentInputs<T, TScalars> =
  | T
  | ParentModelCallback<T, TScalars>;

declare class Connect<TScalars> {
  private callback: ConnectCallback<TScalars>
}

/**
 * omit some keys TKeys from a parent field
 * @example we remove Member from the Organization and User parent fields values as we're coming from Member
 * type MemberParentsInputs = {
 *   Organization: OmitParentInputs<OrganizationParentInputs, "Member">;
 *   User: OmitParentInputs<UserParentInputs, "Member">;
 * };
 */
type OmitParentInputs<
  T,
  TKeys extends string
> = T extends ParentModelCallback<infer U, infer V>
  ? ParentModelCallback<Omit<U, TKeys>, V>
  : Omit<T, TKeys>;

/**
 * compute the inputs type for a given model
 */
type Inputs<TScalars, TParents, TChildren> = Partial<
  MapToColumnValue<TScalars> & TParents & TChildren
>;

/**
 * the configurable map of models' generate and connect functions
 */
export type UserModels = {
  [KStore in keyof Store]?: Store[KStore] extends Array<
    infer TFields extends Record<string, any>
  >
    ? {
        connect?: (ctx: { store: Store }) => TFields;
        data?: Partial<MapToColumnValue<TFields>>;
      }
    : never;
};

type PlanOptions = {
  /**
   * Connect the missing relationships to one of the corresponding models in the store.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/seed#using-autoconnect-option | documentation}.
   */
  connect?: true | Partial<Store>;
  /**
   * Provide custom data generation and connect functions for this plan.
   *
   * Learn more in the {@link https://docs.snaplet.dev/core-concepts/seed#using-autoconnect-option | documentation}.
   */
  models?: UserModels;
  /**
   * Use a custom seed for this plan.
   */
  seed?: string;
};

/**
 * the plan is extending PromiseLike so it can be awaited
 * @example
 * await seed.User({ name: "John" });
 */
export interface Plan extends PromiseLike<Store> {

}`;
}

function generateEnums(dataModel: DataModel) {
  return Object.entries(dataModel.enums)
    .map(
      ([name, { values }]) =>
        `type ${name}Enum = ${values
          .map(({ name }) => `"${name}"`)
          .join(" | ")};`,
    )
    .join(EOL);
}

function generateStoreTypes(dataModel: DataModel) {
  return `type Store = {
${Object.keys(dataModel.models)
  .map((modelName) => `  ${escapeKey(modelName)}: Array<${modelName}Scalars>;`)
  .join(EOL)}
};`;
}

async function generateInputsTypes(props: {
  dataModel: DataModel;
  database2tsType: Database2tsType;
  fingerprint: Fingerprint;
  isJson: IsJson;
  refineType: RefineType;
}) {
  return (
    await Promise.all(
      Object.keys(props.dataModel.models).map((modelName) =>
        generateInputTypes({ ...props, modelName }),
      ),
    )
  ).join(EOL);
}

async function generateInputTypes(props: {
  dataModel: DataModel;
  database2tsType: Database2tsType;
  fingerprint: Fingerprint;
  isJson: IsJson;
  modelName: string;
  refineType: RefineType;
}) {
  const {
    dataModel,
    modelName,
    fingerprint,
    isJson,
    refineType,
    database2tsType,
  } = props;
  const model = dataModel.models[modelName];
  const fields = groupFields(model.fields);
  const jsonSchemaTypes: Array<string> = [];
  const scalarsType = `type ${modelName}Scalars = {
${(
  await Promise.all(
    Object.values(fields.scalars).map(async (f) => {
      const isOptional = f.isGenerated || (f.isRequired && f.hasDefaultValue);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const fingerprintField = fingerprint[modelName]?.[f.name];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (fingerprintField) {
        if (isJson(f.type) && isJsonField(fingerprintField)) {
          const jsonSchemaType = await jsonSchemaToTypescriptType(
            `${modelName}_${f.name}`,
            JSON.stringify(fingerprintField.schema),
          );
          jsonSchemaTypes.push(jsonSchemaType.types);
          const type = refineType(jsonSchemaType.name, f.type, f.isRequired);
          return [
            generateScalarFieldJsDoc({ model, field: f }),
            `  ${escapeKey(f.name)}${isOptional ? "?" : ""}: ${type};`,
          ].join(EOL);
        }
      }

      const tsType = database2tsType(dataModel, f.type, f.isRequired);
      return [
        generateScalarFieldJsDoc({ model, field: f }),
        `  ${escapeKey(f.name)}${isOptional ? "?" : ""}: ${tsType};`,
      ].join(EOL);
    }),
  )
).join(EOL)}
}`;
  const parentsType = `type ${modelName}ParentsInputs = {
${fields.parents
  .map((p) => {
    const parentModel = dataModel.models[p.type];
    // get the parent's field name that references this model

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentField = dataModel.models[p.type].fields.find(
      (f) => f.kind === "object" && f.relationName === p.relationName,
    )!;
    return [
      generateParentFieldJsDoc({
        model,
        field: p,
        parentModel,
      }),
      `  ${escapeKey(p.name)}: OmitParentInputs<${
        p.type
      }ParentInputs, "${escapeKey(parentField.name)}">;`,
    ].join(EOL);
  })
  .join(EOL)}
};`;
  const childrenType = `type ${modelName}ChildrenInputs = {
${fields.children
  // filter out the children that are also parents for cyclic relationships
  .filter((c) => {
    const isCycle = Boolean(
      fields.parents.find((p) => p.name === c.name && p.type === c.type),
    );
    return !isCycle;
  })
  .map((c) => {
    const childModel = dataModel.models[c.type];
    // get the child's field name that references this model
    const childField = childModel.fields.find(
      (f) => f.kind === "object" && f.relationName === c.relationName,
    ) as DataModelObjectField;

    const omittedFields = [childField.name, ...childField.relationFromFields]
      .map((s) => `"${s}"`)
      .join(" | ");

    return [
      generateChildFieldJsDoc({ childModel, childField, model }),
      `  ${escapeKey(c.name)}: OmitChildInputs<${
        c.type
      }ChildInputs, ${omittedFields}>;`,
    ].join(EOL);
  })
  .join(EOL)}
};`;

  const generatedFields = Object.values(fields.scalars)
    .filter((f) => f.isGenerated)
    .map((f) => f.name);

  const scalarsInputsType =
    generatedFields.length > 0
      ? `Omit<${modelName}Scalars, "${generatedFields.join(" | ")}">`
      : `${modelName}Scalars`;

  const extraTypes = `type ${modelName}Inputs = Inputs<
  ${scalarsInputsType},
  ${modelName}ParentsInputs,
  ${modelName}ChildrenInputs
>;
type ${modelName}ChildInputs = ChildInputs<${modelName}Inputs>;
type ${modelName}ParentInputs = ParentInputs<${modelName}Inputs, ${modelName}Scalars>;`;

  return [
    ...jsonSchemaTypes,
    scalarsType,
    parentsType,
    childrenType,
    extraTypes,
  ].join(EOL);
}

function generateScalarFieldJsDoc({
  model,
  field,
}: {
  field: DataModelScalarField;
  model: DataModelModel;
}) {
  return `  /**
   * Column \`${model.tableName}.${field.columnName}\`.
   */`;
}

function generateChildFieldJsDoc({
  childModel,
  childField,
  model,
}: {
  childField: DataModelObjectField;
  childModel: DataModelModel;
  model: DataModelModel;
}) {
  return `  /**
  * Relationship from table \`${model.tableName}\` to table \`${
    childModel.tableName
  }\` through the column${
    childField.relationFromFields.length > 1 ? "s" : ""
  } \`${childField.relationFromFields
    .map((c) => `${childModel.tableName}.${c}`)
    .join("`, `")}\`.
  */`;
}

function generateParentFieldJsDoc({
  model,
  field,
  parentModel,
}: {
  field: DataModelObjectField;
  model: DataModelModel;
  parentModel: DataModelModel;
}) {
  return `  /**
   * Relationship from table \`${model.tableName}\` to table \`${
     parentModel.tableName
   }\` through the column${
     field.relationFromFields.length > 1 ? "s" : ""
   } \`${field.relationFromFields
     .map((c) => `${model.tableName}.${c}`)
     .join("`, `")}\`.
   */`;
}

function generateModelMethodJsDoc(modelName: string) {
  return `  /**
   * Generate one or more \`${modelName}\`.
   * @example With static inputs:
   * \`\`\`ts
   * seed.${modelName}([{}, {}]);
   * \`\`\`
   * @example Using the \`x\` helper:
   * \`\`\`ts
   * seed.${modelName}((x) => x(3));
   * seed.${modelName}((x) => x({ min: 1, max: 10 }));
   * \`\`\`
   * @example Mixing both:
   * \`\`\`ts
   * seed.${modelName}((x) => [{}, ...x(3), {}]);
   * \`\`\`
   */`;
}

function generateSeedClientBaseTypes(dataModel: DataModel) {
  return `export declare class SeedClient {
${Object.keys(dataModel.models)
  .map((modelName) =>
    [
      generateModelMethodJsDoc(modelName),
      `  ${escapeKey(modelName)}: (
    inputs: ${modelName}ChildInputs,
    options?: PlanOptions,
  ) => Plan;`,
    ].join(EOL),
  )
  .join(EOL)}
  /**
   * Reset the client's state.
   */
  $reset(): void;

  /**
   * Delete all data in the database while preserving the database structure.
   */
  $resetDatabase(): Promise<unknown>;

  /**
   * Get the global store.
   */
  $store: Store;

  /**
   * Get a new client. This is useful if you don't want to alter the current client's state.
   */
  $transaction<T>(callback: (seed: SeedClient) => Promise<T>): Promise<T>;
}`;
}

function generateSeedClientTypes(databaseClientType: string) {
  return `
  export type SeedClientOptions = {
    dryRun?: boolean;
    models?: UserModels;
  }
  export declare const createSeedClient: (db: ${databaseClientType}, options?: SeedClientOptions) => Promise<SeedClient>`;
}
