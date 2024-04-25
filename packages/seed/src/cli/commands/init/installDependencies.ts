import { dirname } from "node:path";
import { type Adapter } from "#adapters/types.js";
import {
  getInstalledDependencies,
  getPackageJsonPath,
  getPackageManager,
} from "#config/utils.js";
import { getVersion } from "#core/version.js";
import { spinner } from "../../lib/output.js";

export async function installDependencies({ adapter }: { adapter: Adapter }) {
  const installedDependencies = await getInstalledDependencies();

  const devDependenciesToInstall = [
    "@snaplet/copycat",
    `@snaplet/seed@${getVersion()}`,
    adapter.packageName,
    ...(adapter.typesPackageName ? [adapter.typesPackageName] : []),
  ].filter((d) => !installedDependencies[d]);

  if (devDependenciesToInstall.length === 0) {
    return;
  }

  const devDependenciesToInstallList = devDependenciesToInstall
    .sort((a, b) => a.localeCompare(b))
    .map((d) => `\`${d}\``)
    .join(", ");

  spinner.start(`Installing the dependencies: ${devDependenciesToInstallList}`);

  const packageManager = await getPackageManager();
  const packageJsonPath = await getPackageJsonPath();

  await packageManager.add(devDependenciesToInstall, {
    dev: true,
    cwd: dirname(packageJsonPath),
  });

  spinner.succeed(
    `Installed the dependencies: ${devDependenciesToInstallList}`,
  );
}
