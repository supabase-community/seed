import { snakeCase } from "lodash";
import { shouldGenerateFieldValue } from "#core/dataModel/shouldGenerateFieldValue.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type DetermineShapeFromType } from "#core/dialect/types.js";
import { type StartPredictionsColumn } from "#trpc/shapes.js";

export const columnsToPredict = (
  dataModel: DataModel,
  determineShapeFromType: DetermineShapeFromType,
) => {
  const allColumns: Array<StartPredictionsColumn> = [];

  for (const model of Object.values(dataModel.models)) {
    const columns = model.fields
      .map((field) => {
        if (
          field.kind !== "scalar" ||
          !shouldGenerateFieldValue(field) ||
          determineShapeFromType(field.type) !== null
        ) {
          return null;
        }

        return {
          schemaName: model.schemaName ?? "",
          tableName: model.tableName,
          columnName: field.columnName,
          pgType: field.type,
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
