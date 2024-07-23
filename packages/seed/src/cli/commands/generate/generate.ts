import { type Argv } from "yargs";

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
    async (args) => {
      const { generateHandler } = await import("./generateHandler.js");
      await generateHandler(args);
    },
  );
}
