import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { helloCommand } from "./commands/hello/hello.js";

const program = yargs(hideBin(process.argv)).scriptName("snaplet");

helloCommand(program);

await program.parse();
