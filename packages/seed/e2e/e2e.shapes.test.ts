import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { type AddressInfo } from "node:net";
import { promisify } from "node:util";
import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type cliRouter, createCliRouter, trpc } from "#trpc/router.js";
import { type TableShapePredictions } from "#trpc/shapes.js";

const getServer = async ({ router }: { router: typeof cliRouter }) => {
  const httpServer = createHTTPServer({
    router,
  }).server;

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      resolve(void 0);
    });
  });

  return {
    url: `http://localhost:${(httpServer.address() as AddressInfo).port}`,
    server: httpServer,
    [Symbol.asyncDispose]: async () => {
      await promisify(httpServer.close.bind(httpServer))();
    },
  };
};

for (const [dialect, adapter] of adapterEntries.filter(
  ([d]) => d === "postgres",
)) {
  const computeName = (name: string) => `e2e > shapes > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("generates data using shapes given back by predictions api", async () => {
    await using server = await getServer({
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
                    {
                      column: "createdAt",
                      confidence: 0.99,
                      shape: "DATE",
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
            "email" text NOT NULL,
            "createdAt" timestamp with time zone NOT NULL
          );
        `,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'

          const seed = await createSeedClient()
          await seed.users((x) => x(2));
        `,
      env: {
        SNAPLET_API_URL: server.url,
      },
    });

    // context(justinvdm, 20 Mar 2024): Postgres client gives back Date instance
    // while sqlite client gives back string, so we JSON stringify and parse to normalize
    expect(
      JSON.parse(JSON.stringify(await db.query('SELECT * from "User"'))),
    ).toEqual([
      {
        email: "Tito.Kessler12280@cruel-symbol.biz",
        fullName:
          "Percipi nulla in quos effloresse es sit, et linis invitamot sunt perin.",
        createdAt: "2020-04-04T04:00:44.000Z",
      },
      {
        email: "Antwon_Wehner56302@waltzwater.com",
        fullName: "Quam in unt locus mihi.",
        createdAt: "2020-12-04T11:47:53.000Z",
      },
    ]);
  });

  test("generates data using shape examples given back by predictions api", async () => {
    await using server = await getServer({
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
          import { createSeedClient } from '#snaplet/seed'

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

  if (dialect !== "sqlite") {
    test("handles array fields", async () => {
      await using server = await getServer({
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
                    tableName: "Tmp",
                    predictions: [
                      {
                        column: "values",
                        confidence: 0.99,
                        shape: "PERSON_FIRST_NAME",
                      },
                    ],
                  },
                ] as Array<TableShapePredictions>,
              };
            } else if (context.path === "predictions.seedShapeRoute") {
              nextData = {
                result: [
                  {
                    examples: ["Foo Bar"],
                    shape: "PERSON_FIRST_NAME",
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
            CREATE TABLE "Tmp" (
              "values" text[] NOT NULL
            );
          `,
        seedScript: `
            import { createSeedClient } from '#snaplet/seed'

            const seed = await createSeedClient()
            await seed.tmps((x) => x(2));
          `,
        env: {
          SNAPLET_API_URL: server.url,
        },
      });

      expect(await db.query('SELECT * from "Tmp"')).toEqual([
        {
          values: ["Foo Bar"],
        },
        {
          values: ["Foo Bar"],
        },
      ]);
    });
  }
}
