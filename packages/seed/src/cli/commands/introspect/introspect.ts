import { type Argv } from "yargs";

export function introspectCommand(program: Argv) {
  return program.command(
    "introspect",
    "Introspect and generate the data model for your database",
    async () => {
      const { introspectHandler } = await import("./introspectHandler.js");
      await introspectHandler();
      (await import("exit-hook")).gracefulExit();
    },
  );
}
