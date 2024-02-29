import { trpc } from "#trpc/client.js";
import { type TableShapePredictions } from "#trpc/shapes.js";

export const fetchShapeExamples = async (
  shapePredictions: Array<TableShapePredictions>,
) => {
  const shapes = new Set<string>();

  for (const predictionTable of shapePredictions) {
    for (const prediction of predictionTable.predictions) {
      if (prediction.shape) {
        shapes.add(prediction.shape);
      }
    }
  }

  const response = await trpc.predictions.seedShapeRoute.mutate({
    shapes: Array.from(shapes),
  });

  return response.result;
};
