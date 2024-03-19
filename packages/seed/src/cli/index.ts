import { gracefulExit } from "exit-hook";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateCommand } from "./commands/generate/generate.js";
import { introspectCommand } from "./commands/introspect/introspect.js";
import { loginCommand } from "./commands/login/login.js";
import { setupCommand } from "./commands/setup/setup.js";

const program = yargs(hideBin(process.argv)).scriptName("@snaplet/seed");

generateCommand(program);
introspectCommand(program);
loginCommand(program);
setupCommand(program);

await program.parse();

gracefulExit();
