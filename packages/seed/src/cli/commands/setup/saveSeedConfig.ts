import dedent from "dedent";
import { gracefulExit } from "exit-hook";
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
    import ${adapter.package.import} from "${adapter.package.name}";

    export default defineConfig({
      adapter: ${adapter.package.isAsync ? "async " : ""}() => {
        const client = ${adapter.package.createClient()};
        return new ${adapter.className}(client);
      },
    });
  `;

  await setSeedConfig(template);

  const seedConfigPath = await getSeedConfigPath();

  spinner.succeed(`Seed config saved to ${link(seedConfigPath)}`);

  console.log(
    "Please insert your database connection details in the seed.config.ts file and rerun the setup command.",
  );

  gracefulExit();
}
