import { gracefulExit } from "exit-hook";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { SnapletError, isError } from "#core/utils.js";
import { generateCommand } from "./commands/generate/generate.js";
import { introspectCommand } from "./commands/introspect/introspect.js";
import { loginCommand } from "./commands/login/login.js";
import { setupCommand } from "./commands/setup/setup.js";
import { versionOption } from "./commands/version.js";
import { debug } from "./lib/debug.js";

const program = yargs(hideBin(process.argv)).scriptName("@snaplet/seed");

generateCommand(program);
introspectCommand(program);
loginCommand(program);
setupCommand(program);
versionOption(program);

const handleFailure = (message: null | string, error: unknown) => {
  if (message != null) {
    console.error(error);
  }

  if (SnapletError.instanceof(error)) {
    console.error(error.toString());
  } else if (isError(error)) {
    console.error(error.stack);
  } else if (error != null) {
    console.error(String(error));
    debug(error);
  }

  gracefulExit(1);
};

try {
  await program.fail(handleFailure).parseAsync();
  gracefulExit();
} catch (e) {
  handleFailure(null, e);
}
