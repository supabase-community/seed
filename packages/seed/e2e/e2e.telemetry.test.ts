import { execa } from "execa";
import { readFile, writeFile } from "node:fs/promises";
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
import { type ProjectConfig } from "#config/project/projectConfig.js";
import { type SystemConfig } from "#config/systemConfig.js";
import { adapterEntries } from "#test/adapters.js";
import { ROOT_DIR } from "#test/constants.js";
import { setupProject } from "#test/setupProject.js";

interface Server {
  close: () => Promise<unknown>;
  server: HTTPServer;
  url: string;
}

interface Event {
  distinct_id: string;
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

    expect(
      events
        .map(({ event }) => event)
        .filter((event) => event !== "$create_alias"),
    ).toEqual([
      "$command:sync:start",
      "$action:predict:end",
      "$command:sync:end",
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

  test("aliases from anonymous to user id", async () => {
    const { events, server } = await createEventCapturingServer();

    const script = `
      import { createSeedClient } from '#snaplet/seed'

      const seed = await createSeedClient()
      await seed.foos((x) => x(2));
      await seed.bars((x) => x(2));
    `;

    const { systemDir, runSeedScript, runSync } = await setupProject({
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
        CI: "",
        GITHUB_ACTIONS: "",
        SNAPLET_TELEMETRY_HOST: server.url,
        SNAPLET_ENABLE_TELEMETRY: "1",
        SNAPLET_DISABLE_TELEMETRY: "0",
      },
    });

    const eventsBeforeLogin = [...events];
    events.length = 0;
    const eventsAfterLogin = events;

    const systemConfigPath = path.join(systemDir, "system.json");

    const config = JSON.parse(
      (await readFile(systemConfigPath)).toString(),
    ) as SystemConfig;

    expect(config.anonymousId).toBeDefined();

    expect(config.userId).not.toBeDefined();

    config.userId = "1";

    await writeFile(systemConfigPath, JSON.stringify(config));

    await runSync();
    await runSeedScript(script);

    for (const event of eventsBeforeLogin) {
      expect(event.distinct_id).toEqual(config.anonymousId);
    }

    for (const event of eventsAfterLogin) {
      expect(event.distinct_id).toEqual(config.userId);
    }

    for (const event of eventsAfterLogin.filter(
      (event) => event.event === "$create_alias",
    )) {
      expect(event.properties).toEqual(
        expect.objectContaining({
          alias: config.anonymousId,
          distinct_id: config.userId,
        }),
      );
    }

    for (const event of eventsAfterLogin.filter(
      (event) => event.event !== "$create_alias",
    )) {
      expect(event.properties).toEqual(
        expect.objectContaining({
          $set: expect.objectContaining({
            userId: config.userId,
          }),
        }),
      );
    }
  });

  test("uses the project id as the distinct id when logged out on CI", async () => {
    const { events, server } = await createEventCapturingServer();

    const script = `
      import { createSeedClient } from '#snaplet/seed'

      const seed = await createSeedClient()
      await seed.foos((x) => x(2));
      await seed.bars((x) => x(2));
    `;

    const { systemDir, runSeedScript, runSync } = await setupProject({
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
        CI: "1",
        GITHUB_ACTIONS: "1",
        SNAPLET_TELEMETRY_HOST: server.url,
        SNAPLET_ENABLE_TELEMETRY: "1",
        SNAPLET_DISABLE_TELEMETRY: "0",
      },
    });

    events.length = 0;

    const systemConfigPath = path.join(systemDir, "system.json");

    const systemConfig = JSON.parse(
      (await readFile(systemConfigPath)).toString(),
    ) as SystemConfig;

    expect(systemConfig.anonymousId).not.toBeDefined();
    expect(systemConfig.userId).not.toBeDefined();

    await runSync();
    await runSeedScript(script);

    for (const event of events) {
      expect(event.distinct_id).toEqual("testProject:ci");
    }
  });

  test("does not send events when logged out on CI and there is no project id in the project config", async () => {
    const { events, server } = await createEventCapturingServer();

    const { cwd, systemDir, runSync } = await setupProject({
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
        CI: "1",
        GITHUB_ACTIONS: "1",
        SNAPLET_TELEMETRY_HOST: server.url,
        SNAPLET_ENABLE_TELEMETRY: "1",
        SNAPLET_DISABLE_TELEMETRY: "0",
      },
    });

    events.length = 0;

    const systemConfigPath = path.join(systemDir, "system.json");

    const systemConfig = JSON.parse(
      (await readFile(systemConfigPath)).toString(),
    ) as SystemConfig;

    expect(systemConfig.anonymousId).not.toBeDefined();
    expect(systemConfig.userId).not.toBeDefined();

    const projectConfigPath = path.join(cwd, ".snaplet", "config.json");
    const projectConfig = (JSON.parse(
      (await readFile(projectConfigPath)).toString(),
    ) ?? {}) as ProjectConfig;
    delete projectConfig.projectId;

    await writeFile(projectConfigPath, JSON.stringify(projectConfig));

    await runSync();

    expect(events).toEqual([]);
  });

  test("the built package sends telemetry", async () => {
    const { events, server } = await createEventCapturingServer();

    const { cwd } = await setupProject({
      adapter,
      databaseSchema: `
          CREATE TABLE "Foo" (
            "baz" text NOT NULL
          );
        `,
    });

    await execa("pnpm", ["build"], {
      cwd: ROOT_DIR,
    });

    expect(events.length).toBe(0);

    await execa(
      "node",
      [path.join(ROOT_DIR, "dist", "src", "cli", "index.js"), "generate"],
      {
        cwd,
        extendEnv: true,
        env: {
          CI: "",
          GITHUB_ACTIONS: "",
          SNAPLET_TELEMETRY_HOST: server.url,
          SNAPLET_DISABLE_TELEMETRY: "",
        },
      },
    );

    expect(
      events.find((event) => event.event === "$command:generate:end"),
    ).toBeDefined();
  });
}
