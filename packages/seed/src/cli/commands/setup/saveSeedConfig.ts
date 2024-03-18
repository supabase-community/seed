import { gracefulExit } from "exit-hook";
import { type Adapter } from "#adapters/types.js";
import {
  getSeedConfigPath,
  setSeedConfig,
} from "#config/seedConfig/seedConfig.js";
import { link, spinner } from "../../lib/output.js";

export async function saveSeedConfig({ adapter }: { adapter: Adapter }) {
  await setSeedConfig(adapter.template());

  const seedConfigPath = await getSeedConfigPath();

  spinner.succeed(
    `Seed config saved to ${link(seedConfigPath)}, please fill in the connection parameters and rerun the setup command.`,
  );

  gracefulExit();
}
