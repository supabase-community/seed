import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function predictCommand(program: Argv) {
  return program.command(
    "predict",
    false,
    {},
    telemetryMiddleware(async () => {
      const { predictHandler } = await import("./predictHandler.js");
      await predictHandler();
    }),
  );
}
