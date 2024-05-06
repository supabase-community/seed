import { telemetry } from "#cli/lib/telemetry.js";
import {
  getProjectConfig,
  getProjectConfigPath,
} from "#config/project/projectConfig.js";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { getShapePredictions } from "#core/predictions/shapePredictions/getShapePredictions.js";
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
import { bold, brightGreen, spinner } from "../../lib/output.js";
import { listenForKeyPress } from "./listenForKeyPress.js";

export async function predictHandler({
  isInit = false,
}: {
  isInit?: boolean;
} = {}) {
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
      `Starting up ${bold("Snaplet AI")} tasks to generate sample data 🤖`,
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

    let columns = columnsToPredict(dataModel, dialect.determineShapeFromType);
    const inputs = columns.map((c) =>
      formatInput([c.schemaName, c.tableName, c.columnName]),
    );

    const currentInputSet = new Set(
      (await getShapePredictions()).flatMap((list) =>
        list.predictions.map((item) =>
          formatInput([list.schemaName, list.tableName, item.column]),
        ),
      ),
    );

    const project = (await trpc.project.list.query()).find(
      (project) => project.id === projectConfig.projectId,
    );
    const isEmptyProject = project ? project.SeedDataSet.length === 0 : true;

    // context(justinvdm, 3 May 2024):
    // * If the project is empty (has no data sets), then we'll need to wait for its prediction jobs to start
    // * If the project is not empty, there will only be prediction jobs to wait for if there are new inputs
    const hasNewInputs =
      (isEmptyProject && inputs.length > 0) ||
      inputs.some((input) => !currentInputSet.has(input));

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

    const skipMessage = `ℹ ${bold("Taking too long")}? Hit '${brightGreen("s")}' to skip - we'll continue the work in the cloud, you'll be able to use your AI-generated data once complete`;

    const displayEnhanceProgress = (percent?: number) => {
      if (!percent) {
        return [
          `Starting up ${bold("Snaplet AI")} tasks to generate sample data 🤖`,
          skipMessage,
        ].join("\n\n");
      } else {
        return [
          `[ ${percent}% ] Generating sample data with ${bold("Snaplet AI")} 🤖`,
          skipMessage,
        ].join("\n\n");
      }
    };

    const promisedDataGeneration = timers.dataGenerationWait.wrap(
      waitForDataGeneration,
    )({
      hasNewInputs,
      onProgress({ percent }) {
        if (percent > 0) {
          spinner.text = displayEnhanceProgress(percent);
        }
      },
    });
    const shapePredictions = await promisedShapePrediction;
    await setShapePredictions(shapePredictions);

    spinner.text = displayEnhanceProgress();

    const sKeyPress = listenForKeyPress("s");

    spinner.text = displayEnhanceProgress();

    const dataGenerationResult = await Promise.race([
      promisedDataGeneration.then(() => "COMPLETE"),
      sKeyPress.promise.then(() => "CANCELLED_BY_USER" as const),
    ]);

    // context(justinvdm, 30 Apr 2024): Manually stop the timer in case the user cancelled
    timers.dataGenerationWait.stop();

    spinner.clear();

    if (dataGenerationResult === "CANCELLED_BY_USER") {
      spinner.info(
        `ℹ Sample data generation ${bold("skipped")} for now - you can use the data already generated. Snaplet AI data generation will ${bold("continue in the cloud")}. Once completed, you can use this data with ${bold("npx @snaplet/seed sync")}`,
      );
      console.log();
    }

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
      spinner.succeed(`Sample data generation complete! 🤖`);
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
      isEmptyProject,
      ...durations,
    });

    return { ok: true };
  } catch (error) {
    spinner.fail(`Failed to generate sample data`);
    throw error;
  }
}
