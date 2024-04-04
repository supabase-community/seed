import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function introspectCommand(program: Argv) {
  return program.command(
    "introspect",
    false,
    {},
    telemetryMiddleware(async () => {
      const { introspectHandler } = await import("./introspectHandler.js");
      await introspectHandler();
    }),
  );
}
