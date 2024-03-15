import { type Argv } from "yargs";

export function loginCommand(program: Argv) {
  return program.command("login", "Login to your Snaplet account", async () => {
    const { loginHandler } = await import("./loginHandler.js");
    await loginHandler();
    (await import("exit-hook")).gracefulExit();
  });
}
