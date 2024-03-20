import { type Argv } from "yargs";
import { getVersion } from "#core/version.js";

export function versionOption(program: Argv) {
  program.version(getVersion());
}
