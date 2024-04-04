import { watch } from "node:fs/promises";
import { type Adapter } from "#adapters/types.js";
import {
  getSeedConfigPath,
  setSeedConfig,
} from "#config/seedConfig/seedConfig.js";
import { eraseLines, link, spinner } from "../../lib/output.js";
import { isConnected } from "./isConnected.js";

export async function saveSeedConfig({ adapter }: { adapter: Adapter }) {
  await setSeedConfig(adapter.template());

  const seedConfigPath = await getSeedConfigPath();

  spinner.succeed(`Seed configuration saved to ${link(seedConfigPath)}`);

  if (await isConnected()) {
    return;
  }

  spinner.start(
    `Please enter your database connection details by editing ${link("seed.config.ts", seedConfigPath)}`,
  );

  const watcher = watch(seedConfigPath);
  for await (const event of watcher) {
    if (event.eventType === "change" && (await isConnected())) {
      spinner.stop();
      eraseLines(1);
      break;
    }
  }
}
