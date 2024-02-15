import { type Argv } from "yargs";

export function generateCommand(program: Argv) {
  return program.command(
    "introspect",
    "Introspect and generate the data model for your database",
    (y) =>
      y.option("connection-string", {
        alias: "c",
        describe:
          "The connection string to use for introspecting your database",
        type: "string",
      }),
    async (_args) => {
      await import("./introspectHandler.js");
    },
  );
}
