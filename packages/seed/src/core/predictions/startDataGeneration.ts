import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import {
  type DataModel,
  type DataModelScalarField,
} from "#core/dataModel/types.js";
import { trpc } from "#trpc/client.js";
import { formatInput } from "./utils.js";

const POLL_INTERVAL = 1000;
const MAX_START_WAIT = 1000 * 3;

type DataGenerationJob = Awaited<
  ReturnType<
    typeof trpc.predictions.getIncompleteDataGenerationJobsStatusRoute.query
  >
>["incompleteJobs"][number];

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

const computeDataGenerationProgressPercent = (
  seenJobs: Set<string>,
  incompleteJobs: Array<DataGenerationJob>,
) => {
  if (seenJobs.size === 0) {
    return 0;
  }

  return ((seenJobs.size - incompleteJobs.length) / seenJobs.size) * 100;
};

type WaitForDataGeneration = (options?: {
  isInit?: boolean;
  onProgress?: (context: { percent: number }) => unknown;
}) => Promise<unknown>;

export const startDataGeneration = async (
  projectId: string,
  dataModel: DataModel,
  fingerprintConfig: SeedConfig["fingerprint"],
): Promise<{
  waitForDataGeneration: WaitForDataGeneration;
}> => {
  const prompts = gatherPrompts(projectId, dataModel, fingerprintConfig);

  await Promise.all(
    prompts.map((prompt) =>
      trpc.predictions.startDataGenerationJobRoute.mutate(prompt),
    ),
  );

  const waitForDataGeneration: WaitForDataGeneration = async ({
    isInit = false,
    onProgress,
  } = {}) => {
    let isDone = false;
    const seenJobs = new Set<string>();

    if (isInit) {
      const startTimeoutTime = Date.now() + MAX_START_WAIT;

      // context(justinvdm, 25 April 2024): First wait for the first incomplete job to appear so that we don't jump the gun.
      // We won't wait more than MAX_START_WAIT for this first incomplete job
      while (!isDone && Date.now() < startTimeoutTime) {
        const result =
          await trpc.predictions.getIncompleteDataGenerationJobsStatusRoute.query(
            {
              projectId,
            },
          );

        for (const job of result.incompleteJobs) {
          seenJobs.add(job.id);
        }

        onProgress?.({
          percent: computeDataGenerationProgressPercent(
            seenJobs,
            result.incompleteJobs,
          ),
        });

        if (result.incompleteJobs.length > 0) {
          isDone = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        }
      }
    }

    // context(justinvdm, 25 April 2024): Now that we have incomplete jobs to wait for, poll until there are no more
    // incomplete jobs
    isDone = false;

    while (!isDone) {
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
