import { type Argv } from "yargs";

export function introspectCommand(program: Argv) {
  return program.command(
    "introspect",
    "Introspect and generate the data model for your database",
    (y) =>
      y.option("connection-string", {
        alias: "c",
        describe:
          "The connection string to use for introspecting your database",
        type: "string",
        demandOption: true,
      }),
    async (args) => {
      const { introspectHandler } = await import("./introspectHandler.js");
      await introspectHandler(args);
    },
  );
}
