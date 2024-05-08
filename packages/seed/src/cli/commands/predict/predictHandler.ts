import { telemetry } from "#cli/lib/telemetry.js";
import { computePredictionContext } from "#core/predictions/computePredictionContext.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { startPredictionJobs } from "#core/predictions/startPredictionJobs.js";
import { type DataExample } from "#core/predictions/types.js";
import { createTimer, serializeTimerDurations } from "#core/utils.js";
import { trpc } from "#trpc/client.js";
import { bold, brightGreen, spinner } from "../../lib/output.js";
import { listenForKeyPress } from "./listenForKeyPress.js";

const displayEnhanceProgress = ({
  percent,
  showSkip,
}: {
  percent?: number;
  showSkip?: boolean;
} = {}) => {
  const skipMessage = `ℹ ${bold("Taking too long")}? Hit '${brightGreen("s")}' to skip - we'll continue the work in the cloud, you'll be able to use your AI-generated data once complete`;

  if (!percent) {
    return [
      `Starting up ${bold("Snaplet AI")} tasks to generate sample data 🤖`,
      showSkip ? skipMessage : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  } else {
    return [
      `[ ${percent}% ] Generating sample data with ${bold("Snaplet AI")} 🤖`,
      showSkip ? skipMessage : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
};

export async function predictHandler({
  isInit = false,
}: {
  isInit?: boolean;
} = {}) {
  try {
    spinner.start(displayEnhanceProgress());

    const timers = {
      totalPrediction: createTimer(),
      totalJobs: createTimer(),
      dataGenerationJobs: createTimer(),
      shapePredictionJobs: createTimer(),
      totalFetch: createTimer(),
      shapePredictionsFetch: createTimer(),
      shapeExamplesFetch: createTimer(),
      datasetsFetch: createTimer(),
    };

    timers.totalPrediction.start();

    const context = await computePredictionContext();

    const sKeyPress = listenForKeyPress("s");

    spinner.text = displayEnhanceProgress({
      showSkip: true,
    });

    timers.totalJobs.start();
    timers.shapePredictionJobs.start();
    timers.shapePredictionJobs.start();

    const predictionJobs = startPredictionJobs(context);
    let lastProgressPercent: null | number = null;

    predictionJobs.events
      .on("progress", ({ percent }) => {
        lastProgressPercent = percent;

        spinner.text = displayEnhanceProgress({
          percent,
          showSkip: true,
        });
      })
      .on("dataGenerationJobsComplete", () => {
        timers.dataGenerationJobs.stop();
      })
      .on("shapePredictionJobsComplete", () => {
        timers.shapePredictionJobs.stop();
      });

    const predictionJobsResult = await Promise.race([
      predictionJobs.promise.then(() => "COMPLETE" as const),
      sKeyPress.promise.then(() => "CANCELLED_BY_USER" as const),
    ]);

    timers.totalJobs.stop();
    timers.shapePredictionJobs.stop();
    timers.dataGenerationJobs.stop();

    spinner.clear();

    if (predictionJobsResult === "CANCELLED_BY_USER") {
      spinner.info(
        `ℹ Sample data generation ${bold("skipped")} for now - you can use the data already generated. Snaplet AI data generation will ${bold("continue in the cloud")}. Once completed, you can use this data with ${bold("npx @snaplet/seed sync")}`,
      );
      console.log();
    }

    timers.totalFetch.start();

    const shapePredictions = await timers.shapePredictionsFetch.wrap(
      fetchShapePredictions,
    )(context.columns);

    const dataExamples: Array<DataExample> = [];

    const shapeExamples =
      await timers.shapeExamplesFetch.wrap(fetchShapeExamples)(
        shapePredictions,
      );

    dataExamples.push(...shapeExamples);

    const customDataSet = await timers.datasetsFetch.wrap(
      trpc.predictions.customSeedDatasetRoute.mutate,
    )({
      inputs: context.inputs,
      projectId: context.projectId,
    });

    timers.totalFetch.stop();

    dataExamples.push(...customDataSet);
    await setDataExamples(dataExamples);

    if (predictionJobsResult !== "CANCELLED_BY_USER") {
      spinner.succeed(`Sample data generation complete! 🤖`);
    }

    timers.totalPrediction.stop();
    const durations = serializeTimerDurations(timers);

    durations["totalDataGeneration"] =
      timers.dataGenerationJobs.duration + timers.datasetsFetch.duration;

    durations["totalShapePrediction"] =
      timers.shapePredictionJobs.duration +
      timers.shapePredictionsFetch.duration +
      timers.shapeExamplesFetch.duration;

    await telemetry.captureEvent("$action:predict:end", {
      skippedByUser: predictionJobsResult === "CANCELLED_BY_USER",
      lastProgressPercent,
      isInit,
      ...durations,
    });

    return { ok: true };
  } catch (error) {
    spinner.fail(`Failed to generate sample data`);
    throw error;
  }
}
