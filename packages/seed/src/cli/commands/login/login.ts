import { type Argv } from "yargs";

export function loginCommand(program: Argv) {
  return program.command("login", "Log into your Snaplet account", async () => {
    const { loginHandler } = await import("./loginHandler.js");
    const { cliTelemetry } = await import("../../lib/cliTelemetry.js");
    await cliTelemetry.captureEvent("$command:login:start");
    await loginHandler();
    await cliTelemetry.captureEvent("$command:login:end");
  });
}
