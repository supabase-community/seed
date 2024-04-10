import { type Argv } from "yargs";

export function configOption(program: Argv) {
  program
    .option("config", {
      type: "string",
      description: "Path to the config file",
    })
    .middleware((argv) => {
      if (argv.config) {
        process.env["SNAPLET_SEED_CONFIG"] = argv.config;
      }
    });
}
