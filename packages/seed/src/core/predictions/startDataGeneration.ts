import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import {
  type DataModel,
  type DataModelScalarField,
} from "#core/dataModel/types.js";
import { trpc } from "#trpc/client.js";
import { formatInput } from "./utils.js";

const POLL_INTERVAL = 1000;
const MAX_START_WAIT = 1000 * 5;
const MAX_COMPLETION_WAIT = 1000 * 60;

const gatherPrompts = (
  projectId: string,
  dataModel: DataModel,
  fingerprintConfig: SeedConfig["fingerprint"] = {},
) => {
  const prompts: Array<{
    description: string;
    examples?: Array<string>;
    input: string;
    projectId: string;
    sampleSize?: number;
  }> = [];

  for (const modelName of Object.keys(fingerprintConfig)) {
    const modelConfig = fingerprintConfig[modelName];
    const model = dataModel.models[modelName];

    const scalarFieldsByName = new Map(
      model.fields
        .map((field) =>
          field.kind === "scalar"
            ? ([field.name, field] as [string, DataModelScalarField])
            : null,
        )
        .filter(Boolean),
    );

    for (const fieldName of Object.keys(modelConfig)) {
      const fieldConfig = modelConfig[fieldName];
      const field = scalarFieldsByName.get(fieldName);

      if (field && "description" in fieldConfig && fieldConfig.description) {
        prompts.push({
          projectId,
          input: formatInput([
            model.schemaName ?? "",
            model.tableName,
            field.columnName,
          ]),
          description: fieldConfig.description,
          examples: fieldConfig.examples,
          sampleSize: fieldConfig.itemCount,
        });
      }
    }
  }

  return prompts;
};

export const startDataGeneration = async (
  projectId: string,
  dataModel: DataModel,
  fingerprintConfig: SeedConfig["fingerprint"],
): Promise<{
  waitForDataGeneration: () => Promise<unknown>;
}> => {
  const prompts = gatherPrompts(projectId, dataModel, fingerprintConfig);

  const results = await Promise.all(
    prompts.map((prompt) =>
      trpc.predictions.startDataGenerationJobRoute.mutate(prompt),
    ),
  );

  const jobs = results.filter((job) => job.status !== "SUCCESS");
  const hasPromptJobs = jobs.length > 0;

  const waitForDataGeneration = async () => {
    let isDone = false;

    const startTimeoutTime = hasPromptJobs
      ? Infinity
      : Date.now() + MAX_START_WAIT;

    while (!isDone && Date.now() < startTimeoutTime) {
      const result =
        await trpc.predictions.getIncompleteDataGenerationJobsStatusRoute.query(
          {
            projectId,
          },
        );
      if (result.incompleteJobs.length > 0) {
        isDone = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    isDone = false;
    const completionTimeoutTime = hasPromptJobs
      ? Infinity
      : Date.now() + MAX_COMPLETION_WAIT;

    while (!isDone && Date.now() < completionTimeoutTime) {
      const result =
        await trpc.predictions.getIncompleteDataGenerationJobsStatusRoute.query(
          {
            projectId,
          },
        );
      if (result.incompleteJobs.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      } else {
        isDone = true;
      }
    }

    return isDone;
  };

  return { waitForDataGeneration };
};
