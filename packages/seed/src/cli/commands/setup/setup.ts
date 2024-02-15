import { type Argv } from "yargs";

export function setupCommand(program: Argv) {
  return program.command("setup", "Setup seed for your project", (_args) => {
    console.log("setup");
  });
}
