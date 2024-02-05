import { type Argv } from "yargs";

export function helloCommand(program: Argv) {
  return program.command(
    "hello <name>",
    "Say hello",
    (y) =>
      y.positional("name", {
        demandOption: true,
        describe: "Name to say hello to",
        type: "string",
      }),
    async (args) => {
      const { hello } = await import("@snaplet/core");

      console.log(hello(args.name));
    },
  );
}
