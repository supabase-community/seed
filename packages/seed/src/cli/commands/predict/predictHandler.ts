import { telemetry } from "#cli/lib/telemetry.js";
import { computePredictionContext } from "#core/predictions/computePredictionContext.js";
import { fetchShapeExamples } from "#core/predictions/shapeExamples/fetchShapeExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { fetchShapePredictions } from "#core/predictions/shapePredictions/fetchShapePrediction.js";
import { setShapePredictions } from "#core/predictions/shapePredictions/setShapePredictions.js";
import { startPredictionJobs } from "#core/predictions/startPredictionJobs.js";
import { type DataExample } from "#core/predictions/types.js";
import { createTimer, serializeTimerDurations } from "#core/utils.js";
import { trpc } from "#trpc/client.js";
import { bold, brightGreen, spinner } from "../../lib/output.js";
import { listenForKeyPress } from "./listenForKeyPress.js";
import * as ort from 'onnxruntime-node';
import { AutoTokenizer } from '@xenova/transformers';
import fs from 'fs';
import { env } from '@xenova/transformers';
import { findUp } from "find-up";

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
  test = true
}: {
  isInit?: boolean;
  test?: boolean;
} = {}) {
  const inputText = "public user address";
  const predictedLabel = await predictShape(inputText);
  console.log(`The predicted label is: ${predictedLabel}`);
  if (test) {
    return { ok: true };
  }
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

    await setShapePredictions(shapePredictions);

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

async function predictShape(input: string): Promise<string> {
  // Define the model directory
 const modelDir = await findUp('model', { type: 'directory' });
 if(!modelDir) {
    throw new Error('Model directory not found');
  }
  env.localModelPath = modelDir;

    try {
        // Load label mappings
        const labelMappings: any = JSON.parse(fs.readFileSync(`${modelDir}/label_mappings.json`, 'utf-8'));
        const id2label = labelMappings.id2label;

        // Load the tokenizer
        const tokenizer = await AutoTokenizer.from_pretrained(`/tokenizer/`, { local_files_only: true });

        // Load the ONNX model

        // @ts-ignore
        const session = await ort.InferenceSession.create(`${modelDir}/model.onnx`);

        // Function to get the best label from the output
        function getBestLabel(logits: Float32Array): string {
            const predictedLabelIndex = logits.reduce((bestIdx, currentVal, currentIdx, array) =>
                currentVal > array[bestIdx] ? currentIdx : bestIdx, 0);
            return id2label[predictedLabelIndex.toString()];
        }

        // Prepare the input
        const maxLength = 25;
        // @ts-ignore
        const inputIdsArray = await tokenizer.encode(input, null, { padding: 'max_length', truncation: true, max_length: maxLength });

        // Create attention mask (1 for real tokens, 0 for padding)
        const attentionMaskArray = inputIdsArray.map(id => (id > 0 ? 1 : 0));

        // Ensure the arrays are padded to maxLength
        const padArray = (arr: number[], maxLength: number) => {
            while (arr.length < maxLength) {
                arr.push(0);
            }
            return arr;
        };

        const paddedInputIdsArray = padArray([...inputIdsArray], maxLength);
        const paddedAttentionMaskArray = padArray([...attentionMaskArray], maxLength);

        // Convert arrays to BigInt64Array and create tensors
        const inputIds = new ort.Tensor('int64', BigInt64Array.from(paddedInputIdsArray.map(BigInt)), [1, maxLength]);
        const attentionMask = new ort.Tensor('int64', BigInt64Array.from(paddedAttentionMaskArray.map(BigInt)), [1, maxLength]);

        // Run the ONNX model
        const feeds = { input_ids: inputIds, attention_mask: attentionMask };
        const results = await session.run(feeds);

        // Get the logits from the model output
        const logits = results.logits.data as Float32Array;

        // Get the best label
        const bestLabel = getBestLabel(logits);
        return bestLabel;

    } catch (error) {
        console.error('Error during inference:', error);
        throw error;
    }
}



