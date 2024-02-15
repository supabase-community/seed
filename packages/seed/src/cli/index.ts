import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateCommand } from "./commands/generate/generate.js";
import { introspectCommand } from "./commands/introspect/introspect.js";
import { setupCommand } from "./commands/setup/setup.js";

const program = yargs(hideBin(process.argv)).scriptName("@snaplet/seed");

generateCommand(program);
introspectCommand(program);
setupCommand(program);

await program.parse();
