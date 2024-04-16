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
          },
        ] as Array<{
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
              }),
            ),
            modelInfo: z
              .object({
                version: z.string(),
                engine: z.string(),
              })
              .optional(),
            tableNames: z.array(z.string()).optional(),
            projectId: z.string().optional(),
          }),
        )
        .mutation(() => {
          return { predictionJobId: "1" };
        }),
      getPredictionJobProgressRoute: publicProcedure
        .input(
          z.object({
            predictionJobId: z.string().min(1),
          }),
        )
        .query(() => {
          return {
            status: "COMPLETED" as "COMPLETED" | "IN_PROGRESS",
            progress: {
              current: 1,
              total: 1,
              message: "finished" as string | undefined,
            },
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
