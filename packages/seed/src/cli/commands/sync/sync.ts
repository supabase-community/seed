import { type Argv } from "yargs";

export function syncCommand(program: Argv) {
  return program.command(
    "sync",
    "Synchronize your database schema with Seed Client",
    {
      output: {
        hidden: true,
        alias: "o",
        describe: "A custom directory path to output the generated assets to",
        type: "string",
      },
    },
    async (args) => {
      const { syncHandler } = await import("./syncHandler.js");
      await syncHandler(args);
    },
  );
}
