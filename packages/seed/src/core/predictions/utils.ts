import { snakeCase } from "change-case";
import { type FingerprintConfig } from "#config/seedConfig/fingerprint/schemas.js";
import { isPartOfRelation, isUniqueField } from "#core/dataModel/dataModel.js";
import { shouldGenerateFieldValue } from "#core/dataModel/shouldGenerateFieldValue.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type DetermineShapeFromType } from "#core/dialect/types.js";
import { LLM_PREDICTABLE_TYPES } from "#core/dialect/utils.js";
import { type StartPredictionsColumn } from "#trpc/shapes.js";

export const columnsToPredict = (
  dataModel: DataModel,
  determineShapeFromType: DetermineShapeFromType,
  fingerprintConfig: FingerprintConfig = {},
) => {
  const allColumns: Array<StartPredictionsColumn> = [];

  for (const [modelName, model] of Object.entries(dataModel.models)) {
    const modelFingerprintConfig = fingerprintConfig[modelName] ?? {};

    const columns = model.fields
      .map((field) => {
        if (
          field.kind !== "scalar" ||
          // If the scalar with hold the relation (user_id, post_id, etc), we don't want to generate a value for it
          isPartOfRelation(dataModel, modelName, field.name) ||
          // If the field has a default value that will be generated by the database itself, we don't want to
          // generate a value for it, but rather let the database handle it
          field.hasDefaultValue ||
          !shouldGenerateFieldValue(field) ||
          determineShapeFromType(field.type) !== null
        ) {
          return null;
        }
        const isLLMPredictable =
          // f the field type is not a text field that can benefit from LLM examples
          LLM_PREDICTABLE_TYPES.has(field.type) &&
          // If the field is part of an unique constraint with only one field, we rather fallback to copycat
          // function to generate the value with the most possible uniqueness and avoid collisions rather than pool of examples
          !isUniqueField(dataModel, modelName, field.name);

        const fieldFingerprintConfig = modelFingerprintConfig[field.name] ?? {};

        const promptFieldFingerprintConfig =
          "description" in fieldFingerprintConfig
            ? fieldFingerprintConfig
            : null;

        return {
          schemaName: model.schemaName ?? "",
          tableName: model.tableName,
          columnName: field.columnName,
          pgType: field.type,
          useLLMByDefault: isLLMPredictable,
          description: promptFieldFingerprintConfig?.description,
          examples: promptFieldFingerprintConfig?.examples,
          sampleSize: promptFieldFingerprintConfig?.itemCount,
        };
      })
      .filter(Boolean);

    allColumns.push(...columns);
  }
  return allColumns;
};

export const formatInput = (values: Array<string>) => {
  return values.map((value) => snakeCase(value)).join(" ");
};
