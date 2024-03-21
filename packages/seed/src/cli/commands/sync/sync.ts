import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function syncCommand(program: Argv) {
  return program.command(
    "sync",
    "Synchronize your database schema with Seed Client",
    {
      output: {
        hidden: true,
        alias: "o",
        describe: "A custom directory path to output the generated assets to",
        type: "string",
      },
    },
    telemetryMiddleware(async (args) => {
      const { syncHandler } = await import("./syncHandler.js");
      await syncHandler(args);
    }),
  );
}