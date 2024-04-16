import { getProjectConfig } from "#config/project/projectConfig.js";
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
  const projectConfig = await getProjectConfig();
  if (!projectConfig || !projectConfig.projectId) {
    spinner.fail("No project found, please run `npx @snaplet/seed init` first");
    return;
  }

  let columns = columnsToPredict(dataModel, dialect.determineShapeFromType);
  const customDataSet = await trpc.predictions.customSeedDatasetRoute.mutate({
    inputs: columns.map((c) =>
      formatInput([c.schemaName, c.tableName, c.columnName]),
    ),
    projectId: projectConfig.projectId,
  });
  if (customDataSet.length > 0) {
    columns = columns.filter((c) => {
      const input = formatInput([c.schemaName, c.tableName, c.columnName]);
      return !customDataSet.some((e) => e.input === input);
    });
    dataExamples.push(...customDataSet);
  }
  const tableNames = Object.values(dataModel.models).map((m) => m.id);
  const shapePredictions = await fetchShapePredictions(
    columns,
    tableNames,
    projectConfig.projectId,
  );
  await setShapePredictions(shapePredictions);

  const shapeExamples = await fetchShapeExamples(shapePredictions);
  dataExamples.push(...shapeExamples);
  await setDataExamples(dataExamples);

  spinner.succeed("Got the models' shapes for enhanced data generation 🤖");
}
