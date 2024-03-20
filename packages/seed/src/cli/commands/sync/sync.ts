import { type Argv } from "yargs";

export function syncCommand(program: Argv) {
  return program.command(
    "sync",
    "Synchronize your database structure with Snaplet Seed",
    async () => {
      const { syncHandler } = await import("./syncHandler.js");
      await syncHandler();
    },
  );
}
