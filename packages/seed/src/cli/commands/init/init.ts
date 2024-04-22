import { type Argv } from "yargs";
import { telemetryWithUsageStatsMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function initCommand(program: Argv) {
  return program.command(
    "init",
    "Initialize Snaplet Seed locally for your project",
    {},
    telemetryWithUsageStatsMiddleware(async () => {
      const { initHandler } = await import("./initHandler.js");
      await initHandler();
    }),
  );
}
