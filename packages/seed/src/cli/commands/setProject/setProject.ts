import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function setProjectCommand(program: Argv) {
  return program.command(
    "set-project",
    "Sets or creates the Snaplet project to link @snaplet/seed to",
    {},
    telemetryMiddleware(async () => {
      const { setProjectHandler } = await import("./setProjectHandler.js");
      await setProjectHandler();
    }),
  );
}
