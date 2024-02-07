import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateCommand } from "./commands/generate/generate.js";

const program = yargs(hideBin(process.argv)).scriptName("@snaplet/seed");

generateCommand(program);

await program.parse();
