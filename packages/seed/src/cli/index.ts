import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateCommand } from "./commands/generate/generate.js";
import { introspectCommand } from "./commands/introspect/introspect.js";
import { loginCommand } from "./commands/login/login.js";
import { setupCommand } from "./commands/setup/setup.js";
import { teardownCli } from "./lib/teardownCli.js";

const program = yargs(hideBin(process.argv)).scriptName("@snaplet/seed");

generateCommand(program);
introspectCommand(program);
loginCommand(program);
setupCommand(program);

try {
  await program.parse();
} finally {
  await teardownCli();
}
