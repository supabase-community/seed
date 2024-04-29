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
        })
        .option("reset", {
          type: "boolean",
          describe: "Treats this as a new project and overrides existing files",
        }),
    telemetryWithUsageStatsMiddleware(async (args) => {
      const { initHandler } = await import("./initHandler.js");
      await initHandler(args);
    }),
  );
}
