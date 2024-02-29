import { spinner } from "#cli/lib/spinner.js";
import { type DataModel } from "#core/dataModel/types.js";
import { trpc } from "#trpc/client.js";
import {
  type StartPredictionsColumn,
  type TableShapePredictions,
} from "#trpc/shapes.js";

export const fetchShapePredictions = async (
  dataModel: DataModel,
): Promise<Array<TableShapePredictions>> => {
  spinner.info(`Predicting data labels...`);
  const allColumns: Array<StartPredictionsColumn> = [];
  const shapePredictions: Array<TableShapePredictions> = [];

  for (const model of Object.values(dataModel.models)) {
    // todo(justinvdm, 28 Feb 2024): Avoid calling api with fields we would have not used the result
    // for anyways
    // https://linear.app/snaplet/issue/S-1897/npx-snapletseed-generate-per-dialect-shape-logic

    const columns = model.fields.map((f) => ({
      schemaName: model.schemaName ?? "",
      tableName: model.tableName,
      columnName: f.name,
      pgType: f.type,
    }));

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