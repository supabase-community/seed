import { getDataModel } from "#core/dataModel/dataModel.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { setShapePredictions } from "#core/predictions/shapePredictions/setShapePredictions.js";
import { type DataExample } from "#core/predictions/types.js";
import { columnsToPredict, formatInput } from "#core/predictions/utils.js";
import { getDialect } from "#dialects/getDialect.js";
import { trpc } from "#trpc/client.js";
import { spinner } from "../../lib/output.js";

export async function predictHandler() {
  spinner.start("Getting the models' shapes for enhanced data generation 🤖");
  const dataModel = await getDataModel();
  const dialect = await getDialect();
  const dataExamples: Array<DataExample> = [];
  // Here we need to get the project from the config file
  // but first we need to select the project in the setup
  // and save the projectId.
  const projects = await trpc.project.list.query();
  let selectedProject = projects[0];

  let columns = columnsToPredict(dataModel, dialect.determineShapeFromType);
  const customDataSet = await trpc.predictions.customSeedDatasetRoute.mutate({
    inputs: columns.map((c) =>
      formatInput([c.schemaName, c.tableName, c.columnName]),
    ),
    projectId: selectedProject.id,
  });
  if (customDataSet.length > 0) {
    columns = columns.filter((c) => {
      const input = formatInput([c.schemaName, c.tableName, c.columnName]);
      return !customDataSet.some((e) => e.input === input);
    });
    dataExamples.push(...customDataSet);
  }
  const shapePredictions = await fetchShapePredictions(columns);
  await setShapePredictions(shapePredictions);

  const shapeExamples = await fetchShapeExamples(shapePredictions);
  dataExamples.push(...shapeExamples);
  await setDataExamples(dataExamples);

  spinner.succeed("Got the models' shapes for enhanced data generation 🤖");
}
