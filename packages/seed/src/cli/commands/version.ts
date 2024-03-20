import { type Argv } from "yargs";
import { getVersion } from "#core/version.js";

export function versionCommand(program: Argv) {
  program.version(getVersion());
}
