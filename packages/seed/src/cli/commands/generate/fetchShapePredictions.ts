import { spinner } from "#cli/lib/spinner.js";
import { shouldGenerateFieldValue } from "#core/dataModel/shouldGenerateFieldValue.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type DetermineShapeFromType } from "#core/dialect/types.js";
import { trpc } from "#trpc/client.js";
import {
  type StartPredictionsColumn,
  type TableShapePredictions,
} from "#trpc/shapes.js";

export const fetchShapePredictions = async (props: {
  dataModel: DataModel;
  determineShapeFromType: DetermineShapeFromType;
}): Promise<Array<TableShapePredictions>> => {
  const { determineShapeFromType, dataModel } = props;
  spinner.info(`Predicting data labels...`);
  const allColumns: Array<StartPredictionsColumn> = [];
  const shapePredictions: Array<TableShapePredictions> = [];

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

  const { predictionJobId } =
    await trpc.predictions.startPredictionJobRoute.mutate({
      columns: allColumns,
      modelInfo: {
        version: "20240801",
        engine: "FINETUNED_DISTI_BERT_SEED_ONLY",
      },
    });

  let done = false;
  let previousProgress: number | undefined;

  while (!done) {
    const { status, progress } =
      await trpc.predictions.getPredictionJobProgressRoute.query({
        predictionJobId,
      });

    // Only update progress if it has changed
    if (progress.current !== previousProgress) {
      spinner.info(
        `Prediction progress: ${progress.current} / ${progress.total}`,
      );
    }
    previousProgress = progress.current;

    if (status === "COMPLETED") {
      done = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  spinner.info("Fetching predictions...");
  // Batch 100 columns at a time to avoid hitting the max query size
  const batchSize = 100;
  for (
    let startIndex = 0;
    startIndex < allColumns.length;
    startIndex += batchSize
  ) {
    const columns = allColumns.slice(startIndex, startIndex + batchSize);
    const predictions = await trpc.predictions.predictionsRoute.mutate({
      columns,
      forGenerate: true,
      modelInfo: {
        version: "20240801",
        engine: "FINETUNED_DISTI_BERT_SEED_ONLY",
      },
    });
    shapePredictions.push(...predictions.tableShapePredictions);
  }
  return shapePredictions;
};
