import { stringify } from "javascript-stringify";
import { type CodegenContext } from "#core/codegen/codegen.js";
import {
  type DataModel,
  type DataModelField,
  type DataModelModel,
  type DataModelScalarField,
} from "#core/dataModel/types.js";
import { type Dialect } from "#core/dialect/types.js";
import { isJsonField } from "#core/fingerprint/fingerprint.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type DataExample } from "#core/predictions/types.js";
import { formatInput } from "#core/predictions/utils.js";
import { generateCodeFromTemplate } from "#core/userModels/templates/codegen.js";
import { type UserModels } from "#core/userModels/types.js";
import { jsonStringify } from "#core/utils.js";
import { type Shape, type TableShapePredictions } from "#trpc/shapes.js";
import { shouldGenerateFieldValue } from "../../dataModel/shouldGenerateFieldValue.js";
import { unpackNestedType } from "../../dialect/unpackNestedType.js";
import { encloseValueInArray } from "../../userModels/encloseValueInArray.js";
import { generateJsonField } from "./generateJsonField.js";

const SHAPE_PREDICTION_CONFIDENCE_THRESHOLD = 0.65;

const findEnumType = (dataModel: DataModel, field: DataModelField) =>
  Object.entries(dataModel.enums).find(
    ([enumName]) => enumName === field.type,
  )?.[1];

const hasUniqueConstraint = (model: DataModelModel, field: DataModelField) => {
  const hasUniqueConstraint = model.uniqueConstraints.find((constraint) =>
    constraint.fields.includes(field.name),
  );
  return Boolean(hasUniqueConstraint);
};

const generateDefaultForField = (props: {
  dataModel: DataModel;
  dialect: Dialect;
  field: DataModelField;
  fingerprint: Fingerprint[string][string] | null;
  model: DataModelModel;
  predictionData: {
    examples: Array<string>;
    input?: string;
    shape: Shape | null;
  };
}) => {
  const { field, dataModel, fingerprint, predictionData, dialect, model } =
    props;

  const matchEnum = findEnumType(dataModel, field);

  if (matchEnum) {
    return `({ seed }) => copycat.oneOf(seed, ${jsonStringify(
      matchEnum.values.map((v) => v.name),
    )})`;
  }

  if (fingerprint && isJsonField(fingerprint)) {
    const result = generateJsonField(fingerprint);
    return `({ seed }) => { return ${result}; }`;
  }

  if (field.kind !== "scalar") {
    return null;
  }

  if (
    (predictionData.shape ?? predictionData.input) &&
    predictionData.examples.length > 0 &&
    // If the field has a unique constraint, we don't want to use the shape examples as they will be repeated
    !hasUniqueConstraint(model, field)
  ) {
    const [, dimensions] = unpackNestedType(field.type);
    let resultCode;

    if (predictionData.input) {
      // Use custom examples
      if (field.maxLength) {
        resultCode = `copycat.oneOfString(seed, getCustomExamples('${predictionData.input}'), { limit: ${JSON.stringify(field.maxLength)} })`;
      } else {
        resultCode = `copycat.oneOfString(seed, getCustomExamples('${predictionData.input}'))`;
      }
    } else {
      // Use examples from predicted shape
      if (field.maxLength) {
        resultCode = `copycat.oneOfString(seed, getExamples('${predictionData.shape}'), { limit: ${jsonStringify(field.maxLength)} })`;
      } else {
        resultCode = `copycat.oneOfString(seed, getExamples('${predictionData.shape}'))`;
      }
    }

    resultCode = encloseValueInArray(resultCode, dimensions);
    return `({ seed }) => ${resultCode}`;
  }

  if (!predictionData.shape) {
    // Still do not have a shape, use shape based on type
    predictionData.shape = dialect.determineShapeFromType(field.type);
  }
  const code = generateCodeFromTemplate({
    input: "seed",
    type: field.type,
    maxLength: field.maxLength ?? null,
    shape: predictionData.shape,
    templates: dialect.templates,
    optionsInput: "options",
  });

  return `({ seed, options }) => { return ${code} }`;
};

const generateDefaultsForModel = (props: {
  dataExamples: Array<DataExample>;
  dataModel: DataModel;
  dialect: Dialect;
  fingerprint: Fingerprint[string] | null;
  model: DataModelModel;
  shapePredictions: TableShapePredictions | null;
}) => {
  const { fingerprint, model, dataModel, shapePredictions, dialect } = props;

  const fields: { data: NonNullable<UserModels[string]["data"]> } = {
    data: {},
  };

  const scalarFields = model.fields.filter(
    (f) => f.kind === "scalar",
  ) as Array<DataModelScalarField>;

  for (const field of scalarFields) {
    const predictionData: {
      examples: Array<string>;
      input?: string;
      shape: Shape | null;
    } = { shape: null, examples: [] };

    const fieldShapePrediction =
      shapePredictions?.predictions.find(
        (prediction) => prediction.column === field.columnName,
      ) ?? null;

    const customExample = props.dataExamples.find(
      (e) =>
        e.input ===
        formatInput([model.schemaName ?? "", model.tableName, field.name]),
    );
    if (customExample) {
      predictionData.input = customExample.input;
      predictionData.examples = customExample.examples;
    } else {
      if (
        fieldShapePrediction?.shape &&
        fieldShapePrediction.confidence &&
        fieldShapePrediction.confidence > SHAPE_PREDICTION_CONFIDENCE_THRESHOLD
      ) {
        predictionData.shape = fieldShapePrediction.shape;
        predictionData.examples =
          props.dataExamples.find((e) => e.shape === predictionData.shape)
            ?.examples ?? [];
      }
    }
    const fieldFingerprint = fingerprint?.[field.name] ?? null;

    if (!shouldGenerateFieldValue(field)) {
      fields.data[field.name] = null;
    } else {
      fields.data[field.name] = generateDefaultForField({
        field,
        dataModel,
        predictionData,
        fingerprint: fieldFingerprint,
        dialect,
        model,
      });
    }
  }
  return fields;
};

const generateDefaultsForModels = (props: {
  dataExamples: Array<DataExample>;
  dataModel: DataModel;
  dialect: Dialect;
  fingerprint: Fingerprint;
  shapePredictions: Array<TableShapePredictions>;
}) => {
  const { fingerprint, dataModel, shapePredictions, dialect } = props;
  const models: UserModels = {};

  for (const [modelName, model] of Object.entries(dataModel.models)) {
    const modelShapePredictions =
      shapePredictions.find(
        (predictions) =>
          model.tableName === predictions.tableName &&
          (model.schemaName ?? "") === predictions.schemaName,
      ) ?? null;

    const modelFingerprint = fingerprint[modelName] ?? null;

    models[modelName] = generateDefaultsForModel({
      model,
      dataModel,
      shapePredictions: modelShapePredictions,
      dataExamples: props.dataExamples,
      fingerprint: modelFingerprint,
      dialect,
    });
  }

  return models;
};

export const generateUserModels = (context: CodegenContext) => {
  const { fingerprint, dataModel, shapePredictions, dataExamples, dialect } =
    context;

  const defaults = generateDefaultsForModels({
    dataModel,
    shapePredictions,
    dataExamples,
    fingerprint,
    dialect,
  });

  const stringifiedDefaults =
    stringify(
      defaults,
      (value, _indent, recur) => {
        if (value === null) {
          return "null";
        }

        if (typeof value === "string") {
          return value;
        }

        return recur(value);
      },
      "  ",
    ) ?? "";
  return `
import { copycat } from "@snaplet/copycat"
import { getDataExamples } from "@snaplet/seed/core/predictions/shapeExamples/getDataExamples";

const shapeExamples = await getDataExamples();

const getCustomExamples = (input) => shapeExamples.find((e) => e.input === input)?.examples ?? []
const getExamples = (shape) => shapeExamples.find((e) => e.shape === shape)?.examples ?? [];

export const userModels = ${stringifiedDefaults};
`;
};
