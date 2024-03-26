import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function initCommand(program: Argv) {
  return program.command(
    "init",
    "Initialize Snaplet Seed locally for your project",
    {},
    telemetryMiddleware(async () => {
      const { initHandler } = await import("./initHandler.js");
      await initHandler();
    }),
  );
}
