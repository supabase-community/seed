import { getDataModel } from "#core/dataModel/dataModel.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setShapeExamples } from "#core/predictions/shapeExamples/setShapeExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { setShapePredictions } from "#core/predictions/shapePredictions/setShapePredictions.js";
import { getDialect } from "#dialects/getDialect.js";
import { spinner } from "../../lib/output.js";

export async function predictHandler() {
  spinner.start("Getting the models' shapes for enhanced data generation 🤖");
  const dataModel = await getDataModel();
  const dialect = await getDialect();

  const shapePredictions = await fetchShapePredictions({
    determineShapeFromType: dialect.determineShapeFromType,
    dataModel,
  });
  await setShapePredictions(shapePredictions);

  const shapeExamples = await fetchShapeExamples(shapePredictions);
  await setShapeExamples(shapeExamples);

  spinner.succeed("Got the models' shapes for enhanced data generation 🤖");
}
