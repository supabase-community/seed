import { type Argv } from "yargs";

export function introspectCommand(program: Argv) {
  return program.command("introspect", false, {}, async () => {
    const { introspectHandler } = await import("./introspectHandler.js");
    await introspectHandler();
  });
}
