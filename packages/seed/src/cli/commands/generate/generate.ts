import { type Argv } from "yargs";

export function generateCommand(program: Argv) {
  return program.command(
    "generate",
    "Generates the assets needed by @snaplet/seed",
    (y) =>
      y.option("output", {
        alias: "o",
        describe: "A custom directory path to output the generated assets to",
        type: "string",
      }),
    async (args) => {
      const { cliTelemetry } = await import("../../lib/cliTelemetry.js");
      const { generateHandler } = await import("./generateHandler.js");
      await cliTelemetry.captureEvent("$command:generate:start");
      await generateHandler(args);
      await cliTelemetry.captureEvent("$command:generate:end");
    },
  );
}
