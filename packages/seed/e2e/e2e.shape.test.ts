import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { type AddressInfo, type Server } from "node:net";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type cliRouter, createCliRouter, trpc } from "#trpc/router.js";
import { type TableShapePredictions } from "#trpc/shapes.js";

for (const dialect of Object.keys(adapters) as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  let servers: Array<Server>;

  const createServer = async ({ router }: { router: typeof cliRouter }) => {
    const server = createHTTPServer({
      router,
    }).server;

    servers.push(server);

    await new Promise((resolve) => {
      server.listen(0, () => {
        resolve(null);
      });
    });

    return {
      url: `http://localhost:${(server.address() as AddressInfo).port}`,
      server,
    };
  };

  beforeEach(() => {
    servers = [];
  });

  afterEach(async () => {
    for (const server of servers) {
      await promisify(server.close.bind(server))();
    }

    servers = [];
  });

  describe.concurrent(
    `e2e: shape: ${dialect}`,
    () => {
      test("generates data using shapes given back by predictions api", async () => {
        const server = await createServer({
          router: createCliRouter({
            publicProcedure: trpc.procedure.use(async (context) => {
              const result = await context.next();
              let nextData;

              if (context.path === "predictions.predictionsRoute") {
                const schemaName = dialect === "postgres" ? "public" : "";
                nextData = {
                  tableShapePredictions: [
                    {
                      schemaName,
                      tableName: "User",
                      predictions: [
                        {
                          column: "firstName",
                          confidence: 0.99,
                          shape: "PERSON_FIRST_NAME",
                        },
                        {
                          column: "email",
                          confidence: 0.99,
                          shape: "EMAIL",
                        },
                      ],
                    },
                  ] as Array<TableShapePredictions>,
                };
              }

              if (nextData) {
                (result as { data: unknown }).data = nextData;
              }
              return result;
            }),
          }),
        });

        const { db } = await setupProject({
          adapter,
          databaseSchema: `
          CREATE TABLE "User" (
            "fullName" text NOT NULL,
            "email" text NOT NULL
          );
        `,
          seedScript: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.users((x) => x(2));
        `,
          env: {
            SNAPLET_API_URL: server.url,
          },
        });

        expect(await db.query('SELECT * from "User"')).toEqual([
          {
            email: "Tito.Kessler12280@cruel-symbol.biz",
            fullName:
              "Percipi nulla in quos effloresse es sit, et linis invitamot sunt perin.",
          },
          {
            email: "Antwon_Wehner56302@waltzwater.com",
            fullName: "Quam in unt locus mihi.",
          },
        ]);
      });

      test("generates data using shape examples given back by predictions api", async () => {
        const server = await createServer({
          router: createCliRouter({
            publicProcedure: trpc.procedure.use(async (context) => {
              const schemaName = dialect === "postgres" ? "public" : "";
              const result = await context.next();
              let nextData;

              if (context.path === "predictions.predictionsRoute") {
                nextData = {
                  tableShapePredictions: [
                    {
                      schemaName,
                      tableName: "User",
                      predictions: [
                        {
                          column: "firstName",
                          confidence: 0.99,
                          shape: "PERSON_FIRST_NAME",
                        },
                        {
                          column: "email",
                          confidence: 0.99,
                          shape: "EMAIL",
                        },
                      ],
                    },
                  ] as Array<TableShapePredictions>,
                };
              } else if (context.path === "predictions.seedShapeRoute") {
                nextData = {
                  result: [
                    {
                      examples: Array(50)
                        .fill(undefined)
                        .map((_, i) => `u${i}@example.org`),
                      shape: "EMAIL",
                    },
                  ] as Array<{
                    examples: Array<string>;
                    shape: string;
                  }>,
                };
              }

              if (nextData) {
                (result as { data: unknown }).data = nextData;
              }
              return result;
            }),
          }),
        });

        const { db } = await setupProject({
          adapter,
          databaseSchema: `
          CREATE TABLE "User" (
            "fullName" text NOT NULL,
            "email" text NOT NULL
          );
        `,
          seedScript: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.users((x) => x(2));
        `,
          env: {
            SNAPLET_API_URL: server.url,
          },
        });

        expect(await db.query('SELECT * from "User"')).toEqual([
          {
            email: "u3@example.org",
            fullName:
              "Percipi nulla in quos effloresse es sit, et linis invitamot sunt perin.",
          },
          {
            email: "u47@example.org",
            fullName: "Quam in unt locus mihi.",
          },
        ]);
      });
    },
    {
      timeout: 45000,
    },
  );
}