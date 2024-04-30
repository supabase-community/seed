import { telemetry } from "#cli/lib/telemetry.js";
import { SNAPLET_APP_URL } from "#config/constants.js";
import {
  getProjectConfig,
  getProjectConfigPath,
} from "#config/project/projectConfig.js";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { setShapePredictions } from "#core/predictions/shapePredictions/setShapePredictions.js";
import { startDataGeneration } from "#core/predictions/startDataGeneration.js";
import { type DataExample } from "#core/predictions/types.js";
import { columnsToPredict, formatInput } from "#core/predictions/utils.js";
import {
  SnapletError,
  createTimer,
  serializeTimerDurations,
} from "#core/utils.js";
import { getDialect } from "#dialects/getDialect.js";
import { trpc } from "#trpc/client.js";
import {
  bold,
  brightGreen,
  highlight,
  link,
  spinner,
} from "../../lib/output.js";
import { listenForKeyPress } from "./listenForKeyPress.js";

export async function predictHandler({
  isInit = false,
}: { isInit?: boolean } = {}) {
  const timers = {
    totalPrediction: createTimer(),
    dataGenerationStart: createTimer(),
    dataGenerationWait: createTimer(),
    shapePredictionStart: createTimer(),
    shapePredictionWait: createTimer(),
    shapeExamplesFetch: createTimer(),
    datasetsFetch: createTimer(),
  };

  timers.totalPrediction.start();

  try {
    spinner.start(
      `Enhancing your generated data using ${bold("Snaplet AI")} 🤖`,
    );

    const dataModel = await getDataModel();
    const dialect = await getDialect();
    const dataExamples: Array<DataExample> = [];
    const projectConfig = await getProjectConfig();
    const seedConfig = await getSeedConfig();

    if (!projectConfig.projectId) {
      throw new SnapletError("SNAPLET_PROJECT_CONFIG_NOT_FOUND", {
        path: await getProjectConfigPath(),
      });
    }

    const organization =
      await trpc.organization.organizationGetByProjectId.query({
        projectId: projectConfig.projectId,
      });

    console.log();
    console.log(
      `ℹ You can tell us more about your data to further ${brightGreen("improve the results")} over here: ${link(`${SNAPLET_APP_URL}/o/${organization.id}/p/${projectConfig.projectId}/seed`)}`,
    );
    console.log();
    console.log(
      `ℹ Data generation **taking too long**? Hit '${highlight("s")}' to skip and proceed with basic data and continue AI data generation in the cloud. You'll be able to use your AI-generated data once complete.`,
    );

    let columns = columnsToPredict(dataModel, dialect.determineShapeFromType);
    const inputs = columns.map((c) =>
      formatInput([c.schemaName, c.tableName, c.columnName]),
    );

    const tableNames = Object.values(dataModel.models).map((m) => m.id);

    const { waitForDataGeneration } = await timers.dataGenerationStart.wrap(
      startDataGeneration,
    )(projectConfig.projectId, dataModel, seedConfig.fingerprint);

    const { waitForShapePredictions } = await timers.shapePredictionStart.wrap(
      fetchShapePredictions,
    )(columns, tableNames, projectConfig.projectId);

    const promisedShapePrediction = timers.shapePredictionWait.wrap(
      waitForShapePredictions,
    )();

    const promisedDataGeneration = timers.dataGenerationWait.wrap(
      waitForDataGeneration,
    )({
      isInit,
      onProgress({ percent }) {
        if (percent > 0) {
          spinner.text = `[ ${percent}% ] Enhancing your generated data using ${bold("Snaplet AI")} 🤖`;
        }
      },
    });

    const shapePredictions = await promisedShapePrediction;
    await setShapePredictions(shapePredictions);

    const sKeyPress = listenForKeyPress("s");

    const dataGenerationResult = await Promise.race([
      promisedDataGeneration.then(() => "COMPLETE"),
      sKeyPress.promise.then(() => "CANCELLED_BY_USER" as const),
    ]);

    // context(justinvdm, 30 Apr 2024): Manually stop the timer in case the user cancelled
    timers.dataGenerationWait.stop();

    if (dataGenerationResult === "CANCELLED_BY_USER") {
      console.log();
      console.log(
        `ℹ AI Data generation ${highlight("skipped")} for now - you can use the data already generated. Snaplet AI data generation will ${bold("continue in the cloud")}. Once completed, you can use this data with ${bold("npx @snaplet/seed sync")}`,
      );
    }

    spinner.text = `Fetching ${bold("Snaplet AI")} results 🤖`;

    const shapeExamples =
      await timers.shapeExamplesFetch.wrap(fetchShapeExamples)(
        shapePredictions,
      );
    dataExamples.push(...shapeExamples);

    const customDataSet = await timers.datasetsFetch.wrap(
      trpc.predictions.customSeedDatasetRoute.mutate,
    )({
      inputs,
      projectId: projectConfig.projectId,
    });
    if (customDataSet.length > 0) {
      dataExamples.push(...customDataSet);
    }

    await setDataExamples(dataExamples);

    if (dataGenerationResult !== "CANCELLED_BY_USER") {
      spinner.succeed("Enhancements complete! 🤖");
    }

    timers.totalPrediction.stop();
    const durations = serializeTimerDurations(timers);

    durations["totalDataGeneration"] =
      timers.dataGenerationStart.duration +
      timers.dataGenerationWait.duration +
      timers.datasetsFetch.duration;

    durations["totalShapePrediction"] =
      timers.shapePredictionStart.duration +
      timers.shapePredictionWait.duration +
      timers.shapeExamplesFetch.duration;

    await telemetry.captureEvent("$action:predict:end", {
      skippedByUser: dataGenerationResult === "CANCELLED_BY_USER",
      isInit,
      ...durations,
    });

    return { ok: true };
  } catch (error) {
    spinner.fail(`Failed to apply enhancements`);
    throw error;
  }
}
