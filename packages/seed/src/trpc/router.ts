import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { type TableShapePredictions } from "./shapes.js";

const t = initTRPC.create();

const router = t.router;

export const trpc = t;

export const createCliRouter = ({ publicProcedure = t.procedure } = {}) =>
  router({
    organization: router({
      create: publicProcedure
        .input(
          z.object({
            organizationName: z.string(),
          }),
        )
        .mutation(() => {
          return {
            id: "1",
            name: "Org 1",
          } as {
            id: string;
            name: string;
          };
        }),
      list: publicProcedure.query(() => {
        return [] as Array<{
          id: string;
          name: string;
        }>;
      }),
      organizationGetByProjectId: publicProcedure
        .input(z.object({ projectId: z.string() }))
        .query(() => {
          return {
            id: "1",
          } as {
            id: string;
          };
        }),
    }),
    project: router({
      create: publicProcedure
        .input(
          z.object({
            name: z.string(),
            regionId: z.literal("aws-eu-central-1"),
            organizationId: z.string(),
          }),
        )
        .mutation(() => {
          return {
            id: "1",
            name: "Project 1",
          } as {
            id: string;
            name: string;
          };
        }),
      list: publicProcedure.query(() => {
        return [
          {
            id: "1",
            name: "Project 1",
            SeedDataSet: [],
          },
        ] as Array<{
          SeedDataSet: Array<{ id: string }>;
          id: string;
          name: string;
        }>;
      }),
    }),
    predictions: router({
      predictionsRoute: publicProcedure
        .input(
          z.object({
            columns: z.array(
              z.object({
                schemaName: z.string(),
                tableName: z.string().min(1),
                columnName: z.string().min(1),
                pgType: z.string().min(1),
              }),
            ),
            forGenerate: z.boolean().default(false),
            modelInfo: z
              .object({
                version: z.literal("20240801"),
                engine: z.literal("FINETUNED_DISTI_BERT_SEED_ONLY"),
              })
              .optional(),
          }),
        )
        .mutation(() => {
          return {
            tableShapePredictions: [] as Array<TableShapePredictions>,
          };
        }),
      startPredictionJobRoute: publicProcedure
        .input(
          z.object({
            columns: z.array(
              z.object({
                schemaName: z.string(),
                tableName: z.string().min(1),
                columnName: z.string().min(1),
                pgType: z.string().min(1),
                useLLMByDefault: z.boolean().default(false),
                description: z.string().optional(),
                examples: z.array(z.string()).optional(),
                sampleSize: z.number().optional(),
              }),
            ),
            modelInfo: z
              .object({
                version: z.string(),
                engine: z.string(),
              })
              .optional(),
            projectId: z.string().optional(),
            shouldEnableDataSets: z.boolean().optional(),
            tableNames: z.array(z.string()).optional(),
          }),
        )
        .mutation(() => {
          return { predictionJobId: "1" };
        }),
      getPredictionJobTotalProgressRoute: publicProcedure
        .input(
          z.object({
            projectId: z.string(),
            since: z.number(),
          }),
        )
        .query(() => {
          return {
            isComplete: true,
            dataGenerationIsComplete: true,
            shapePredictionIsComplete: true,
            progress: 1,
            progressPercent: 100,
            since: 0,
          };
        }),
      seedShapeRoute: publicProcedure
        .input(
          z.object({
            shapes: z.array(z.string()),
          }),
        )
        .mutation(() => {
          return {
            result: [] as Array<{
              examples: Array<string>;
              shape: string;
            }>,
          };
        }),
      customSeedDatasetRoute: publicProcedure
        .input(
          z.object({
            inputs: z.array(z.string()),
            projectId: z.string(),
          }),
        )
        .mutation(() => {
          const seedDataset: Array<{
            examples: Array<string>;
            input: string;
          }> = [];
          return seedDataset;
        }),
    }),
    user: router({
      current: publicProcedure.query(() => {
        return { id: "1", email: "snappy@snaplet.dev" } as {
          email: string;
          id: string;
        } | null;
      }),
    }),
  });

export const cliRouter = createCliRouter();
export type CLIRouter = typeof cliRouter;
