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
    async (_args) => {
      // const { hello } = await import("@snaplet/seed");
      // console.log(hello(args.name));
    },
  );
}
