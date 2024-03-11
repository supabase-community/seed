import { copycat } from "@snaplet/copycat";
import { type ClientState } from "../client/types.js";
import { serializeModelValues, serializeValue } from "../data/data.js";
import { type Json } from "../data/types.js";
import { shouldGenerateFieldValue } from "../dataModel/shouldGenerateFieldValue.js";
import {
  type DataModel,
  type DataModelObjectField,
  type DataModelScalarField,
} from "../dataModel/types.js";
import { groupFields } from "../dataModel/utils.js";
import { isOptionsField } from "../fingerprint/fingerprint.js";
import {
  type Fingerprint,
  type FingerprintField,
} from "../fingerprint/types.js";
import { type Store } from "../store/store.js";
import { type UserModels } from "../userModels/types.js";
import { mergeUserModels } from "../userModels/userModels.js";
import { dedupePreferLast } from "../utils.js";
import { checkConstraints } from "./constraints.js";
import {
  type ChildField,
  type ChildModel,
  type ConnectCallback,
  ConnectInstruction,
  type CountCallback,
  type GenerateOptions,
  type IPlan,
  type ModelData,
  type ModelRecord,
  type ParentField,
  type PlanInputs,
  type PlanOptions,
  type ScalarField,
} from "./types.js";

export class Plan implements IPlan {
  private readonly connectStore?: Record<string, Array<ModelData>>;
  private readonly ctx: ClientState;
  private readonly dataModel: DataModel;
  private readonly fingerprint: Fingerprint;
  private readonly plan: PlanInputs;
  private readonly runStatements?: (
    statements: Array<string>,
  ) => Promise<unknown>;
  private readonly seed?: string;
  private readonly userModels: UserModels;

  public emit: (event: string) => void;
  public options?: PlanOptions;
  public store: Store;

  constructor(props: {
    createStore: (dataModel: DataModel) => Store;
    ctx: ClientState;
    dataModel: DataModel;
    emit: (event: string) => void;
    fingerprint?: Fingerprint;
    options?: PlanOptions;
    plan: PlanInputs;
    runStatements?: (statements: Array<string>) => Promise<void>;
    userModels: UserModels;
  }) {
    this.ctx = props.ctx;
    this.emit = props.emit;
    this.runStatements = props.runStatements;
    this.dataModel = props.dataModel;
    this.fingerprint = props.fingerprint ?? {};
    this.plan = props.plan;
    // plan's internal store
    this.store = props.createStore(props.dataModel);
    if (props.options?.connect) {
      if (props.options.connect === true) {
        this.connectStore = this.ctx.store._store;
      } else {
        const partialStore = props.options.connect;
        this.connectStore = Object.fromEntries(
          Object.keys(this.dataModel.models).map((modelName) => [
            modelName,
            modelName in partialStore ? partialStore[modelName] : [],
          ]),
        );
      }
    }
    this.seed = props.options?.seed;
    this.userModels = props.userModels;
    this.options = props.options;
  }

  private async generateModel(
    {
      ctx,
      model,
      inputs,
    }: PlanInputs & {
      ctx?: {
        index?: number;
        path?: Array<number | string>;
      };
    },
    options: Required<GenerateOptions>,
  ) {
    const path = ctx?.path ?? [model];
    const userModels = options.models;
    const modelStructure = this.dataModel.models[model];

    // this is the "x" function that we inject for child fields: (x) => x(10, (i) => ({ id: i }))
    const countCallback: CountCallback = (x, cb) => {
      const result: Array<ChildModel> = [];

      const seed = `${options.seed}/${path.join("/")}`;
      const n = typeof x === "number" ? x : copycat.int(seed, x);

      for (const i of new Array(n).keys()) {
        if (cb === undefined) {
          result.push({});
        } else if (typeof cb === "function") {
          result.push(
            cb({
              $store: this.ctx.store._store,
              data: {},
              store: this.store._store,
              index: i,
              seed: [seed, i].join("/"),
            }),
          );
        } else {
          result.push(cb);
        }
      }

      return result;
    };

    const modelsInputs =
      typeof inputs === "function"
        ? inputs(countCallback)
        : Array.isArray(inputs)
          ? inputs
          : [inputs];

    const generatedModels: Array<ModelData> = [];

    // we partition the fields into 3 categories:
    // - scalar fields
    // - parent relation fields
    // - child relation fields
    const fields = groupFields(modelStructure.fields);

    for (let index = 0; index < modelsInputs.length; index++) {
      const modelData: ModelData = {};
      const modelSeed = `${options.seed}/${[...path, index].join("/")}`;

      const modelInputs = modelsInputs[index];

      const inputsData = (
        typeof modelInputs === "function"
          ? modelInputs({
              $store: this.ctx.store._store,
              data: {},
              index,
              seed: modelSeed,
              store: this.store._store,
            })
          : modelsInputs[index]
      ) as ModelRecord;

      for (const field of fields.parents) {
        // the parent ids were already provided (by the user or by children generation)
        const parentIdsProvided = field.relationFromFields.every(
          (f) => inputsData[f] !== undefined,
        );
        if (parentIdsProvided) {
          for (const f of field.relationFromFields) {
            modelData[f] = inputsData[f] as Json;
          }
          continue;
        }

        // right now let's not generate nullable parent relations if the user did not specify them or if there is no connect fallback
        if (
          !field.isRequired &&
          inputsData[field.name] === undefined &&
          !userModels[field.type].connect
        ) {
          for (const f of field.relationFromFields) {
            modelData[f] = null;
          }
          continue;
        }

        const getParent = async (parentField?: ParentField) => {
          const parentModelName = field.type;

          if (parentField === undefined) {
            const connectFallback = userModels[parentModelName].connect;
            if (connectFallback) {
              return connectFallback({
                $store: this.ctx.store._store,
                store: this.store._store,
                index,
                seed: `${modelSeed}/${field.name}`,
              });
            }
          }

          // if parentField is defined, it means the user wants to override the default behavior
          // is the parentField a modelCallback
          if (typeof parentField === "function") {
            const modelCallbackResult = parentField({
              $store: this.ctx.store._store,
              connect: (cb: ConnectCallback) => new ConnectInstruction(cb),
              data: {},
              seed: [modelSeed, field.name, 0].join("/"),
              store: this.store._store,
            });

            if (modelCallbackResult instanceof ConnectInstruction) {
              return modelCallbackResult.callback({
                $store: this.ctx.store._store,
                store: this.store._store,
                index,
                seed: `${modelSeed}/${field.name}`,
              });
            }

            parentField = modelCallbackResult;
          }

          const parent = (
            await this.generateModel(
              {
                ctx: {
                  index,
                  path: [...path, index, field.name],
                },
                model: parentModelName,
                // todo: support aliases or fetch relation names
                inputs: [parentField ?? {}] as ChildField,
              },
              options,
            )
          )[0];

          return parent;
        };

        const parent = serializeModelValues(
          await getParent(inputsData[field.name] as ParentField | undefined),
        );

        for (const [i] of field.relationFromFields.entries()) {
          modelData[field.relationFromFields[i]] =
            parent[field.relationToFields[i]];
        }
      }

      const handleScalarField = async (field: DataModelScalarField) => {
        const scalarField = inputsData[field.name] as ScalarField | undefined;
        if (!shouldGenerateFieldValue(field)) {
          return;
        }
        // the field has a default value generated by the database
        // and is not a sequence that we gonna mock
        // we can skip it if the user didn't provide a value
        if (
          !field.isId &&
          field.hasDefaultValue &&
          field.sequence === false &&
          scalarField === undefined
        ) {
          return;
        }
        // the field was already taken care of by a parent relation
        if (modelData[field.name] !== undefined) {
          return;
        }

        const generateFn =
          scalarField === undefined
            ? userModels[model].data?.[field.name]
            : scalarField;

        const value =
          typeof generateFn === "function"
            ? await generateFn({
                index: ctx?.index ?? index,
                seed: `${modelSeed}/${field.name}`,
                data: modelData,
                $store: this.ctx.store._store,
                store: this.store._store,
                options: this.getGenerateOptions(model, field.name),
              })
            : generateFn;

        modelData[field.name] = serializeValue(value);
      };

      // we prioritize ids so we can access them in the store as soon as possible
      for (const field of fields.scalars.filter((f) => f.isId)) {
        await handleScalarField(field);
      }

      // we persist the generated model as soon as we have the ids
      this.store.add(model, modelData);
      this.ctx.store.add(model, modelData);
      generatedModels.push(modelData);

      const scalarFields = this.sortScalars(
        model,
        fields.scalars,
        userModels,
        inputsData,
      );

      // TODO: filter out the fields that are part of a parent relation
      for (const field of scalarFields.filter((f) => !f.isId)) {
        await handleScalarField(field);
      }

      await checkConstraints({
        connectStore: this.connectStore,
        constraintsStores: this.ctx.constraints,
        uniqueConstraints: modelStructure.uniqueConstraints,
        modelData,
        model,
        parentFields: fields.parents,
        inputsData,
        scalarFields,
        modelSeed,
        userModels,
        generateFnCtx: (fieldName: string, counter: number) => ({
          index: ctx?.index ?? index,
          seed: `${modelSeed}/${fieldName}/${counter}`,
          data: modelData,
          $store: this.ctx.store._store,
          store: this.store._store,
          options: this.getGenerateOptions(model, fieldName),
        }),
      });

      for (const field of fields.children) {
        const childModelName = field.type;
        const childField = inputsData[field.name] as ChildField | undefined;
        // skip cyclic relationships where the child is the same as the parent
        if (
          fields.parents.find(
            (p) => p.name === field.name && p.type === field.type,
          )
        ) {
          continue;
        }

        // for now if the child is not user defined, we don't generate it
        if (!childField) {
          continue;
        }
        // we need to find the corresponding relationship in the child to get the impacted columns
        const childModel = this.dataModel.models[childModelName];
        const childRelation = childModel.fields.find(
          (f) => f.kind === "object" && f.relationName === field.relationName,
        ) as DataModelObjectField;

        const childFields: ModelData = {};
        for (const [i] of childRelation.relationFromFields.entries()) {
          childFields[childRelation.relationFromFields[i]] =
            modelData[childRelation.relationToFields[i]];
        }

        let childInputs: ChildField;
        if (typeof childField === "function") {
          childInputs = (cb: CountCallback) => {
            return childField(cb).map((childData, index) => {
              if (typeof childData === "function") {
                childData = childData({
                  $store: this.ctx.store._store,
                  data: {},
                  index,
                  seed: [modelSeed, field.name, index].join("/"),
                  store: this.store._store,
                });
              }
              return {
                ...childData,
                ...childFields,
              } as ModelRecord;
            });
          };
        } else {
          childInputs = childField.map((childData, index) => {
            if (typeof childData === "function") {
              childData = childData({
                $store: this.ctx.store._store,
                data: {},
                index,
                seed: [modelSeed, field.name, index].join("/"),
                store: this.store._store,
              });
            }
            return {
              ...childData,
              ...childFields,
            };
          });
        }

        await this.generateModel(
          {
            ctx: {
              path: [...path, index, field.name],
            },
            model: childModelName,
            inputs: childInputs,
          },
          options,
        );
      }
    }

    return generatedModels;
  }

  private getGenerateOptions(modelName: string, fieldName: string) {
    const fingerprintField =
      modelName in this.fingerprint && fieldName in this.fingerprint[modelName]
        ? this.fingerprint[modelName][fieldName]
        : ({} as FingerprintField);

    if (isOptionsField(fingerprintField)) {
      return fingerprintField.options as Record<string, Json>;
    } else {
      return {};
    }
  }

  private sortScalars(
    modelName: string,
    fields: Array<DataModelScalarField>,
    userModels: UserModels,
    inputsData: ModelRecord | null | undefined,
  ): Array<DataModelScalarField> {
    const fieldMap = new Map(fields.map((field) => [field.name, field]));

    const orderedFieldNames = dedupePreferLast([
      ...fieldMap.keys(),
      ...Object.keys(userModels[modelName].data ?? {}),
      ...Object.keys(inputsData ?? {}),
    ]).filter((fieldName) => fieldMap.has(fieldName));

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return orderedFieldNames.map((name) => fieldMap.get(name)!);
  }

  async generate(options?: GenerateOptions) {
    const seed = this.seed ?? options?.seed;
    // if generate receives options?.models it means it comes from a merge or pipe
    const userModels = mergeUserModels(
      mergeUserModels(this.userModels, options?.models ?? {}),
      this.options?.models ?? {},
    );

    if (this.connectStore) {
      for (const modelName of Object.keys(this.connectStore)) {
        if (this.connectStore[modelName].length > 0) {
          const connectFallback: ConnectCallback = (ctx) =>
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            copycat.oneOf(ctx.seed, this.connectStore![modelName]);
          connectFallback.fallback = true;
          userModels[modelName].connect =
            userModels[modelName].connect ?? connectFallback;
        }
      }
    }

    if (!(this.plan.model in this.ctx.seeds)) {
      this.ctx.seeds[this.plan.model] = -1;
    }
    this.ctx.seeds[this.plan.model] += 1;

    await this.generateModel(
      { ...this.plan },
      {
        models: userModels,
        seed: seed ?? this.ctx.seeds[this.plan.model].toString(),
      },
    );

    return this.store;
  }

  async run() {
    this.emit("$call:plan:run:start");
    const store = await this.generate();
    await this.runStatements?.(store.toSQL());
    this.emit("$call:plan:run:end");
    return store._store;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: unknown) => PromiseLike<TResult1> | TResult1)
      | null
      | undefined,
    onrejected?:
      | ((reason: unknown) => PromiseLike<TResult2> | TResult2)
      | null
      | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}
