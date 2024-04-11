import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function linkCommand(program: Argv) {
  return program.command(
    "link",
    "Links your local directory to a Snaplet Project",
    {},
    telemetryMiddleware(async () => {
      const { linkHandler } = await import("./linkHandler.js");
      await linkHandler();
    }),
  );
}
