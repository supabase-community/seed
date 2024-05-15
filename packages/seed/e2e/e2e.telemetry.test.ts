import { readFile } from "node:fs/promises";
import {
  type Server as HTTPServer,
  type IncomingMessage,
  type ServerResponse,
  createServer as createHTTPServer,
} from "node:http";
import { type AddressInfo } from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { test as _test, type TestFunction, afterAll, expect } from "vitest";
import { type SystemConfig } from "#config/systemConfig.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

interface Server {
  close: () => Promise<unknown>;
  server: HTTPServer;
  url: string;
}

interface Event {
  event: string;
  properties: Record<string, unknown>;
}

let servers: Array<Server> = [];

const createServer = async (
  handlerFn: (req: IncomingMessage, res: ServerResponse) => unknown,
) => {
  const server = createHTTPServer((req, res) => handlerFn(req, res));

  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve(void 0);
    });
  });

  const self: Server = {
    url: `http://localhost:${(server.address() as AddressInfo).port}`,
    server,
    close: promisify(server.close.bind(server)),
  };
  servers.push(self);

  return self;
};

const createEventCapturingServer = async (): Promise<{
  events: Array<Event>;
  server: Server;
}> => {
  const events: Array<Event> = [];

  const server = await createServer(async (request, response) => {
    const { batch } = JSON.parse((await request.toArray()).join("")) as {
      batch: Array<Event>;
    };

    response.statusCode = 200;
    events.push(...batch);
    response.end();
  });

  return {
    server,
    events,
  };
};

afterAll(async () => {
  for (const server of servers) {
    await server.close();
  }
  servers = [];
});

for (const [dialect, adapter] of adapterEntries.filter(
  ([adapter]) => adapter === "postgres",
)) {
  const computeName = (name: string) =>
    `e2e > telemetry > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("sends telemetry", async () => {
    const { events, server } = await createEventCapturingServer();

    await setupProject({
      adapter,
      databaseSchema: `
          CREATE TABLE "Foo" (
            "baz" text NOT NULL
          );

          CREATE TABLE "Bar" (
            "quux" text NOT NULL
          );
        `,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'

          const seed = await createSeedClient()
          await seed.foos((x) => x(2));
          await seed.bars((x) => x(2));
        `,
      env: {
        SNAPLET_TELEMETRY_HOST: server.url,
        SNAPLET_ENABLE_TELEMETRY: "1",
        SNAPLET_DISABLE_TELEMETRY: "0",
      },
    });

    expect(events.map(({ event }) => event)).toEqual([
      "$create_alias",
      "$command:sync:start",
      "$create_alias",
      "$action:predict:end",
      "$create_alias",
      "$command:sync:end",
      "$create_alias",
      "$action:client:create",
    ]);
  });

  test("debounces runtime events on a 24 hour interval", async () => {
    const { events, server } = await createEventCapturingServer();
    const countRuntimeEvents = () =>
      events.filter(({ event }) => event === "$action:client:create").length;

    const script = `
      import { createSeedClient } from '#snaplet/seed'

      const seed = await createSeedClient()
      await seed.foos((x) => x(2));
      await seed.bars((x) => x(2));
    `;

    const { runSeedScript } = await setupProject({
      adapter,
      databaseSchema: `
          CREATE TABLE "Foo" (
            "baz" text NOT NULL
          );

          CREATE TABLE "Bar" (
            "quux" text NOT NULL
          );
        `,
      env: {
        SNAPLET_TELEMETRY_HOST: server.url,
        SNAPLET_ENABLE_TELEMETRY: "1",
        SNAPLET_DISABLE_TELEMETRY: "0",
      },
    });

    const interval24h = 24 * 60 * 60 * 1000;
    const now = interval24h + 23;

    await runSeedScript(script, {
      env: {
        SNAPLET_NOW: now.toString(),
      },
    });

    expect(countRuntimeEvents()).toEqual(1);

    await runSeedScript(script, {
      env: {
        SNAPLET_NOW: (now + interval24h).toString(),
      },
    });

    expect(countRuntimeEvents()).toEqual(1);

    await runSeedScript(script, {
      env: {
        SNAPLET_NOW: (now + interval24h + 1).toString(),
      },
    });

    expect(countRuntimeEvents()).toEqual(2);
  });

  test("aliases to the logged in user", async () => {
    const { events, server } = await createEventCapturingServer();

    const { systemDir } = await setupProject({
      adapter,
      databaseSchema: `
          CREATE TABLE "Foo" (
            "baz" text NOT NULL
          );

          CREATE TABLE "Bar" (
            "quux" text NOT NULL
          );
        `,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'

          const seed = await createSeedClient()
          await seed.foos((x) => x(2));
          await seed.bars((x) => x(2));
        `,
      env: {
        SNAPLET_TELEMETRY_HOST: server.url,
        SNAPLET_ENABLE_TELEMETRY: "1",
        SNAPLET_DISABLE_TELEMETRY: "0",
      },
    });

    const config = JSON.parse(
      (await readFile(path.join(systemDir, "system.json"))).toString(),
    ) as SystemConfig;

    console.log(config);
    expect(config.anonymousId).toBeDefined();

    expect(config.userId).toBeDefined();

    for (const event of events.filter(
      (event) => event.event === "$create_alias",
    )) {
      expect(event.properties).toEqual({
        alias: config.anonymousId,
        distinct_id: config.userId,
      });
    }
  });
}
