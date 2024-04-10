import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function linkCommand(program: Argv) {
  return program.command(
    "link",
    "Sets or creates the Snaplet project to link @snaplet/seed to",
    {},
    telemetryMiddleware(async () => {
      const { linkHandler } = await import("./linkHandler.js");
      await linkHandler();
    }),
  );
}
