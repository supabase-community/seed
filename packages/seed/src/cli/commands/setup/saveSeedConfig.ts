import dedent from "dedent";
import { type Adapter } from "#adapters/types.js";
import {
  getSeedConfigPath,
  setSeedConfig,
} from "#config/seedConfig/seedConfig.js";
import { link, spinner } from "../../lib/output.js";

export async function saveSeedConfig({ adapter }: { adapter: Adapter }) {
  const template = dedent`
    import { defineConfig } from "@snaplet/seed/config";
    import { ${adapter.className} } from "@snaplet/seed/adapter-${adapter.id}";

    export default defineConfig({
      adapter: () => new ${adapter.className}(
        // insert your ${adapter.id} client instance here
      ),
    });
  `;

  await setSeedConfig(template);

  const seedConfigPath = await getSeedConfigPath();

  spinner.succeed(`Seed config saved to ${link(seedConfigPath)}`);
}
