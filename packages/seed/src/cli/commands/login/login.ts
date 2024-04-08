import { type Argv } from "yargs";
import { telemetryMiddleware } from "#cli/lib/middlewares/telemetry.js";

export function loginCommand(program: Argv) {
  return program.command(
    "login",
    "Log into your Snaplet account",
    {
      "access-token": {
        alias: "t",
        description:
          "Snaplet Cloud access token to use for login, you can obtain one at https://app.snaplet.dev/access-tokens",
        type: "string",
      },
    },
    telemetryMiddleware(async (args) => {
      const { loginHandler } = await import("./loginHandler.js");
      await loginHandler(args);
    }),
  );
}
