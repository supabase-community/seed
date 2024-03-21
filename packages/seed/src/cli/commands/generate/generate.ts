import { type Argv } from "yargs";
import { telemetryMiddleware } from "../../lib/middlewares/telemetry.js";

export function generateCommand(program: Argv) {
  return program.command(
    "generate",
    "Generate artifacts (e.g. Seed Client)",
    {
      output: {
        hidden: true,
        alias: "o",
        describe: "A custom directory path to output the generated assets to",
        type: "string",
      },
    },
    telemetryMiddleware(async (args) => {
      const { generateHandler } = await import("./generateHandler.js");
      await generateHandler(args);
    }),
  );
}
