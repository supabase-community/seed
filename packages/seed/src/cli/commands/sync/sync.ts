import { type Argv } from "yargs";

export function syncCommand(program: Argv) {
  return program.command(
    "sync",
    "Synchronize your database structure with Snaplet Seed",
    async () => {
      const { syncHandler } = await import("./syncHandler.js");
      const { cliTelemetry } = await import("../../lib/cliTelemetry.js");
      await cliTelemetry.captureEvent("$command:sync:start");
      await syncHandler();
      await cliTelemetry.captureEvent("$command:sync:end");
    },
  );
}
