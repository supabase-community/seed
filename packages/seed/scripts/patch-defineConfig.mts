import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";

/**
 * This script patches the defineConfig.d.ts file to include the reference to the assets/defineConfig.d.ts type
 * so the user doesn't have to import it manually in their seed.config.ts file to have the TypedConfig type available.
 */

const defineConfigPath = "./dist/config/seedConfig/defineConfig.d.ts";

await writeFile(
  defineConfigPath,
  [
    "// @ts-ignore",
    `/// <reference path="../../../assets/defineConfig.d.ts" />`,
    await readFile(defineConfigPath, "utf-8"),
  ].join(EOL),
);
