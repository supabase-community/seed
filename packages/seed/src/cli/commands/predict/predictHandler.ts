import { SNAPLET_APP_URL } from "#config/constants.js";
import { getProjectConfigPath } from "#config/project/paths.js";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { setShapePredictions } from "#core/predictions/shapePredictions/setShapePredictions.js";
import { startDataGeneration } from "#core/predictions/startDataGeneration.js";
import { type DataExample } from "#core/predictions/types.js";
import { columnsToPredict, formatInput } from "#core/predictions/utils.js";
import { SnapletError } from "#core/utils.js";
import { getDialect } from "#dialects/getDialect.js";
import { trpc } from "#trpc/client.js";
import { spinner } from "../../lib/output.js";

export async function predictHandler() {
  try {
    spinner.start("Getting the models' enhancements 🤖");
    const dataModel = await getDataModel();
    const dialect = await getDialect();
    const dataExamples: Array<DataExample> = [];
    const projectConfig = await getProjectConfig();
    const seedConfig = await getSeedConfig();
    if (!projectConfig || !projectConfig.projectId) {
      throw new SnapletError("SNAPLET_PROJECT_CONFIG_NOT_FOUND", {
        path: await getProjectConfigPath(),
      });
    }

    let columns = columnsToPredict(dataModel, dialect.determineShapeFromType);
    const inputs = columns.map((c) =>
      formatInput([c.schemaName, c.tableName, c.columnName]),
    );

    const tableNames = Object.values(dataModel.models).map((m) => m.id);

    const { waitForDataGeneration } = await startDataGeneration(
      projectConfig.projectId,
      dataModel,
      seedConfig.fingerprint,
    );

    const { waitForShapePredictions } = await fetchShapePredictions(
      columns,
      tableNames,
      projectConfig.projectId,
    );

    const shapePredictions = await waitForShapePredictions();
    await setShapePredictions(shapePredictions);

    const shapeExamples = await fetchShapeExamples(shapePredictions);
    dataExamples.push(...shapeExamples);

    await waitForDataGeneration();

    const customDataSet = await trpc.predictions.customSeedDatasetRoute.mutate({
      inputs,
      projectId: projectConfig.projectId,
    });
    if (customDataSet.length > 0) {
      dataExamples.push(...customDataSet);
    }

    await setDataExamples(dataExamples);

    spinner.succeed("Got model enhancements 🤖");
    const organization =
      await trpc.organization.organizationGetByProjectId.query({
        projectId: projectConfig.projectId,
      });
    console.log(
      `You can improve your generated data with LLM here: ${SNAPLET_APP_URL}/o/${organization.id}/p/${projectConfig.projectId}/seed`,
    );
    return { ok: true };
  } catch (error) {
    spinner.fail(`Failed to get model enhancements`);
    throw error;
  }
}
