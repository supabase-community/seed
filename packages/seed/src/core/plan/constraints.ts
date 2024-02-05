import { copycat } from "@snaplet/copycat";
import { EOL } from "node:os";
import { intersection, sortBy } from "remeda";
import { serializeValue } from "../data/data.js";
import { isParentField } from "../dataModel/dataModel.js";
import {
  type DataModel,
  type DataModelObjectField,
  type DataModelScalarField,
  type DataModelUniqueConstraint,
} from "../dataModel/types.js";
import { type Store } from "../store/store.js";
import { type UserModels } from "../userModels/types.js";
import {
  type GenerateCallback,
  type GenerateCallbackContext,
  type ModelData,
  type ModelRecord,
  type ScalarField,
} from "./types.js";

export function getInitialConstraints(dataModel: DataModel) {
  return Object.fromEntries(
    Object.entries(dataModel.models)
      .filter(([_, model]) => model.uniqueConstraints.length > 0)
      .map(([modelName, model]) => [
        modelName,
        Object.fromEntries(
          model.uniqueConstraints.map((constraint) => [
            constraint.name,
            new Set<string>(),
          ]),
        ),
      ]),
  );
}

export type Constraints = ReturnType<typeof getInitialConstraints>;

/**
 * Shared context between checkConstraints and cartesianProduct
 */
interface Context {
  connectStore?: Store["_store"];
  generateFnCtx: (
    fieldName: string,
    counter: number,
  ) => GenerateCallbackContext;
  inputsData: ModelRecord;
  model: string;
  modelData: ModelData;
  modelSeed: string;
  userModels: UserModels;
}

export async function checkConstraints(
  props: {
    constraintsStores: Constraints;
    parentFields: Array<DataModelObjectField>;
    scalarFields: Array<DataModelScalarField>;
    uniqueConstraints: Array<DataModelUniqueConstraint>;
  } & Context,
) {
  /**
   * We keep track of the fields that were already processed by previous constraints
   * because we can't retry them, they're closed for modifications
   */
  const processedFields: Array<string> = [];

  /**
   * We exclude constraints containing fields that have a default value
   * We can't know the value of this field before inserting the data so we can't build a hash for the constraint
   */
  const filteredConstraints = props.uniqueConstraints.filter((constraint) => {
    return !constraint.fields.some((uniqueField) => {
      const field = props.scalarFields.find((f) => f.name === uniqueField);
      return (
        !field?.isId &&
        field?.hasDefaultValue &&
        field.sequence === false &&
        props.inputsData[field.name] === undefined
      );
    });
  });

  /**
   * We sort the constraints by the number of fields they impact from the smallest to the largest
   * So smallest constraints are prioritized and their fields are closed for modifications for the next constraints
   */
  const sortedConstraints = sortBy(filteredConstraints, (c) => c.fields.length);

  for (const constraint of sortedConstraints) {
    const hash = getHash(
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/no-non-null-assertion
      constraint.fields.map((f) => props.modelData[f]!.toString()),
    );
    const constraintStore =
      props.constraintsStores[props.model][constraint.name];

    // constraint is violated, we try to fix it
    if (constraintStore.has(hash)) {
      // We can only retry parent relation fields with a fallback connect function
      const parentFieldsToRetry = props.parentFields.filter(
        (p) =>
          intersection(p.relationFromFields, constraint.fields).length > 0 &&
          intersection(p.relationFromFields, processedFields).length === 0 &&
          props.inputsData[p.name] === undefined &&
          // @ts-expect-error check if the connect function is tagged as fallback
          props.userModels[p.type].connect?.fallback,
      );
      // We can only retry scalar fields with generateFn function
      const scalarFieldsToRetry = props.scalarFields.filter((f) => {
        const scalarField = props.inputsData[f.name] as ScalarField;
        const generateFn =
          scalarField === undefined
            ? props.userModels[props.model].data?.[f.name]
            : scalarField;

        return (
          constraint.fields.includes(f.name) &&
          !processedFields.includes(f.name) &&
          typeof generateFn === "function"
        );
      });

      processedFields.push(...constraint.fields);

      const getConstraintData = () =>
        constraint.fields.reduce<ModelData>((acc, c) => {
          acc[c] = props.modelData[c];
          return acc;
        }, {});
      let constraintData = getConstraintData();
      // we want to attempt every combination of connections first
      let conflictFixed = await cartesianProduct({
        connectStores: {},
        fields: parentFieldsToRetry,
        level: 0,
        constraintData,
        constraint,
        constraintStore,
        ...props,
      });

      if (!conflictFixed) {
        // we reset the constraint data
        constraintData = getConstraintData();
        // we now try every combination of connections and scalar fields
        conflictFixed = await cartesianProduct({
          connectStores: {},
          fields: [...parentFieldsToRetry, ...scalarFieldsToRetry],
          level: 0,
          constraintData,
          constraint,
          constraintStore,
          ...props,
        });
      }

      if (!conflictFixed) {
        const values = constraint.fields.map((c) => props.modelData[c]);
        throw new Error(
          [
            `Unique constraint "${constraint.name}" violated for model "${props.model}" on fields (${constraint.fields.join(",")}) with values (${values.join(",")})`,
            `Seed: ${props.modelSeed}`,
            `Model data: ${JSON.stringify(props.modelData, null, 2)}`,
          ].join(EOL),
        );
      }

      // at this point the constraint is fixed, yay!
      for (const column of constraint.fields) {
        props.modelData[column] = constraintData[column];
      }
      const hash = getHash(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-base-to-string
        constraint.fields.map((f) => constraintData[f]!.toString()),
      );
      constraintStore.add(hash);
    } else {
      constraintStore.add(hash);
    }
  }
}

function getHash(values: Array<string>) {
  return values.join(":");
}

/**
 * This function attempts to fix a constraint violation by trying every combination of values between the `fields`
 * It mutates the `constraintData` object with the values that fixed the constraint
 */
async function cartesianProduct(
  props: {
    connectStores: Record<string, Array<ModelData>>;
    constraint: DataModelUniqueConstraint;
    constraintData: ModelData;
    constraintStore: Set<string>;
    fields: Array<DataModelObjectField | DataModelScalarField | undefined>;
    level: number;
  } & Context,
): Promise<boolean> {
  if (props.level === props.fields.length) {
    return false;
  }

  const field = props.fields[props.level];

  // props.fields could be empty if all fields were already processed
  if (field === undefined) {
    return false;
  }

  const SCALAR_MAX_ATTEMPTS = 50;
  let iterations = SCALAR_MAX_ATTEMPTS;
  if (isParentField(field) && props.connectStore) {
    iterations = props.connectStore[field.type].length;
  }
  for (let i = 0; i < iterations; i++) {
    if (isParentField(field) && props.connectStore) {
      // process parent field
      let connectStore =
        field.type in props.connectStores
          ? props.connectStores[field.type]
          : [...props.connectStore[field.type]];
      const candidate = copycat.oneOf(
        `${props.modelSeed}/${field.name}`,
        connectStore,
      );

      for (const [i] of field.relationFromFields.entries()) {
        props.constraintData[field.relationFromFields[i]] =
          candidate[field.relationToFields[i]];
      }

      const hash = getHash(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-base-to-string
        props.constraint.fields.map((c) => props.constraintData[c]!.toString()),
      );

      if (!props.constraintStore.has(hash)) {
        return true;
      }

      // remove the candidate from the connect store
      props.connectStores[field.type] = connectStore.filter(
        (p) => !field.relationToFields.every((f) => p[f] === candidate[f]),
      );
    } else {
      // process scalar field
      const scalarField = props.inputsData[field.name] as ScalarField;
      const generateFn = (
        scalarField === undefined
          ? props.userModels[props.model].data?.[field.name]
          : scalarField
      ) as GenerateCallback;

      props.constraintData[field.name] = serializeValue(
        await generateFn(props.generateFnCtx(field.name, i)),
      );

      const hash = getHash(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-base-to-string
        props.constraint.fields.map((f) => props.constraintData[f]!.toString()),
      );

      if (!props.constraintStore.has(hash)) {
        return true;
      }
    }

    const constraintFixed = await cartesianProduct({
      ...props,
      level: props.level + 1,
    });

    if (constraintFixed) {
      return true;
    }
  }

  return false;
}
