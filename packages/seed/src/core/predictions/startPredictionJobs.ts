import { EventEmitter } from "node:events";
import { trpc } from "#trpc/client.js";
import { type PredictionContext } from "./computePredictionContext.js";

type PredictionJobEvents = EventEmitter<{
  dataGenerationJobsComplete: [];
  progress: [
    {
      percent: number;
    },
  ];
  shapePredictionJobsComplete: [];
  started: [];
}>;

interface StartPredictionJobsResult {
  events: PredictionJobEvents;
  promise: Promise<unknown>;
}

export const startPredictionJobs = ({
  columns,
  dataModel,
  projectId,
}: PredictionContext): StartPredictionJobsResult => {
  const startedAt = Date.now();
  const events: PredictionJobEvents = new EventEmitter();

  return {
    events,
    promise: start(),
  };

  async function start() {
    await trpc.predictions.startPredictionJobRoute.mutate({
      columns,
      modelInfo: {
        version: "20240801",
        engine: "FINETUNED_DISTI_BERT_SEED_ONLY",
      },
      tableNames: Object.values(dataModel.models).map((m) => m.id),
      projectId,
      shouldEnableDataSets: true,
    });

    await poll();
  }

  async function poll() {
    let isComplete = false;
    let dataGenerationIsComplete = false;
    let shapePredictionIsComplete = false;
    let since = startedAt;

    while (!isComplete) {
      const result =
        await trpc.predictions.getPredictionJobTotalProgressRoute.query({
          projectId,
          since,
        });

      events.emit("progress", {
        percent: result.progressPercent,
      });

      if (result.dataGenerationIsComplete && !dataGenerationIsComplete) {
        dataGenerationIsComplete = true;
        events.emit("dataGenerationJobsComplete");
      }

      if (result.shapePredictionIsComplete && !shapePredictionIsComplete) {
        shapePredictionIsComplete = true;
        events.emit("shapePredictionJobsComplete");
      }

      isComplete = result.isComplete;
      since = result.since;
    }
  }
};
