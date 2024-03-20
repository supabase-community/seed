import { type Argv } from "yargs";

export function syncCommand(program: Argv) {
  return program.command(
    "sync",
    "Synchronize your database structure with Snaplet Seed",
    (y) =>
      y.option("output", {
        hidden: true,
        alias: "o",
        describe: "A custom directory path to output the generated assets to",
        type: "string",
      }),
    async (args) => {
      const { syncHandler } = await import("./syncHandler.js");
      const { cliTelemetry } = await import("../../lib/cliTelemetry.js");
      await cliTelemetry.captureEvent("$command:sync:start");
      await syncHandler(args);
      await cliTelemetry.captureEvent("$command:sync:end");
    },
  );
}
