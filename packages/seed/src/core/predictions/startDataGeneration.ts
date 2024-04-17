import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import {
  type DataModel,
  type DataModelScalarField,
} from "#core/dataModel/types.js";
import { trpc } from "#trpc/client.js";
import { formatInput } from "./utils.js";

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

      if (field && "prompt" in fieldConfig) {
        const prompt =
          typeof fieldConfig.prompt === "string"
            ? { description: fieldConfig.prompt }
            : fieldConfig.prompt;

        prompts.push({
          projectId,
          input: formatInput([
            model.schemaName ?? "",
            model.tableName,
            field.columnName,
          ]),
          ...prompt,
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

  const jobs = results.filter(
    (job) => job.status === "IN_PROGRESS" && job.dataGenerationJobId !== null,
  );

  const waitForDataGeneration = async () => {
    if (jobs.length === 0) {
      return;
    }

    const pendingJobs = new Set(
      jobs.map((job) => job.dataGenerationJobId) as Array<string>,
    );

    while (pendingJobs.size) {
      for (const dataGenerationJobId of pendingJobs.values()) {
        const { status } =
          await trpc.predictions.getDataGenerationJobStatusRoute.query({
            dataGenerationJobId,
          });

        if (status === "COMPLETED") {
          pendingJobs.delete(dataGenerationJobId);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  return { waitForDataGeneration };
};
