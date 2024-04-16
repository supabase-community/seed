import { trpc } from "#trpc/client.js";
import {
  type StartPredictionsColumn,
  type TableShapePredictions,
} from "#trpc/shapes.js";

export const fetchShapePredictions = async (
  allColumnToPredict: Array<StartPredictionsColumn>,
  tableNames: Array<string>,
  projectId: string,
): Promise<Array<TableShapePredictions>> => {
  const shapePredictions: Array<TableShapePredictions> = [];

  const { predictionJobId } =
    await trpc.predictions.startPredictionJobRoute.mutate({
      columns: allColumnToPredict,
      modelInfo: {
        version: "20240801",
        engine: "FINETUNED_DISTI_BERT_SEED_ONLY",
      },
      tableNames,
      projectId,
    });

  let done = false;

  while (!done) {
    const { status } =
      await trpc.predictions.getPredictionJobProgressRoute.query({
        predictionJobId,
      });

    // Only update progress if it has changed

    if (status === "COMPLETED") {
      done = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  // Batch 100 columns at a time to avoid hitting the max query size
  const batchSize = 100;
  for (
    let startIndex = 0;
    startIndex < allColumnToPredict.length;
    startIndex += batchSize
  ) {
    const columns = allColumnToPredict.slice(
      startIndex,
      startIndex + batchSize,
    );
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
