import { trpc } from "#trpc/client.js";
import {
  type StartPredictionsColumn,
  type TableShapePredictions,
} from "#trpc/shapes.js";

export const fetchShapePredictions = async (
  allColumnToPredict: Array<StartPredictionsColumn>,
): Promise<Array<TableShapePredictions>> => {
  const shapePredictions: Array<TableShapePredictions> = [];

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
