import { type Argv } from "yargs";
import { telemetryWithUsageStatsMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function initCommand(program: Argv) {
  return program.command(
    "init [directory]",
    "Initialize Snaplet Seed locally for your project",
    (y) =>
      y
        .positional("directory", {
          type: "string",
          describe: "Directory path to initialize Snaplet Seed in",
          default: ".",
      }),
    telemetryWithUsageStatsMiddleware(async (args) => {
      const { initHandler } = await import("./initHandler.js");
      await initHandler(args);
    }),
  );
}
