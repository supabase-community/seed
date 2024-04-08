import { gracefulExit } from "exit-hook";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { SnapletError, isError } from "#core/utils.js";
import { configOption } from "./commands/config.js";
import { generateCommand } from "./commands/generate/generate.js";
import { initCommand } from "./commands/init/init.js";
import { introspectCommand } from "./commands/introspect/introspect.js";
import { loginCommand } from "./commands/login/login.js";
import { predictCommand } from "./commands/predict/predict.js";
import { syncCommand } from "./commands/sync/sync.js";
import { versionOption } from "./commands/version.js";
import { debug } from "./lib/debug.js";

const program = yargs(hideBin(process.argv)).scriptName("npx @snaplet/seed");

configOption(program);
initCommand(program);
generateCommand(program);
loginCommand(program);
syncCommand(program);
versionOption(program);
introspectCommand(program);
predictCommand(program);

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
