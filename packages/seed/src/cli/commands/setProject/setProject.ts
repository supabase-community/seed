import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function setProjectCommand(program: Argv) {
  return program.command(
    "set-project",
    false,
    {},
    telemetryMiddleware(async () => {
      const { setProjectHandler } = await import("./setProjectHandler.js");
      await setProjectHandler();
    }),
  );
}
