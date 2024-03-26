import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function loginCommand(program: Argv) {
  return program.command(
    "login",
    "Log into your Snaplet account",
    {},
    telemetryMiddleware(async () => {
      const { loginHandler } = await import("./loginHandler.js");
      await loginHandler();
    }),
  );
}
