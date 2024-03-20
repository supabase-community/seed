import { type Argv } from "yargs";

export function initCommand(program: Argv) {
  return program.command(
    "init",
    "Initialize Snaplet Seed locally for your project",
    async () => {
      const { cliTelemetry } = await import("../../lib/cliTelemetry.js");
      const { initHandler } = await import("./initHandler.js");
      await cliTelemetry.captureEvent("$command:init:start");
      await initHandler();
      await cliTelemetry.captureEvent("$command:init:end");
    },
  );
}
