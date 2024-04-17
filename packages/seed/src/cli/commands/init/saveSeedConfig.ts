import { pathToFileURL } from "node:url";
import { type Adapter } from "#adapters/types.js";
import {
  getSeedConfigPath,
  setSeedConfig,
} from "#config/seedConfig/seedConfig.js";
import { eraseLines, error, link, spinner } from "../../lib/output.js";
import { isConnected } from "./isConnected.js";
import { watchFile } from "./utils.js";

export async function saveSeedConfig({ adapter }: { adapter: Adapter }) {
  await setSeedConfig(adapter.template());

  const seedConfigPath = await getSeedConfigPath();

  spinner.succeed(
    `Seed configuration saved to ${link(pathToFileURL(seedConfigPath).toString())}`,
  );

  if ((await isConnected()).result) {
    return;
  }

  spinner.start(
    `Please enter your database connection details by editing the Seed configuration file`,
  );

  const watcher = watchFile(seedConfigPath);
  let attempt = 0;
  for await (const event of watcher) {
    if (event.eventType === "change") {
      attempt += 1;
      spinner.text = `Please enter your database connection details by editing the Seed configuration file (attempt: ${attempt})`;
      const connectionAttempt = await isConnected();
      if (connectionAttempt.result) {
        spinner.stop();
        eraseLines(1);
        break;
      } else {
        spinner.suffixText = `\n${error("Connection failed:")} ${connectionAttempt.reason}\n`;
      }
    }
  }
  spinner.suffixText = ``;
  spinner.text = ``;
}
