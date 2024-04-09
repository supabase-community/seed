import { type Adapter } from "#adapters/types.js";
import {
  getInstalledDependencies,
  getPackageManager,
  getRootPath,
} from "#config/utils.js";
import { getVersion } from "#core/version.js";
import { spinner } from "../../lib/output.js";

export async function installDependencies({ adapter }: { adapter: Adapter }) {
  const installedDependencies = await getInstalledDependencies();

  const dependenciesToInstall = [adapter.packageName].filter(
    (d) => !installedDependencies[d],
  );

  const devDependenciesToInstall = [
    "@snaplet/copycat",
    `@snaplet/seed@${getVersion()}`,
    ...(adapter.typesPackageName ? [adapter.typesPackageName] : []),
  ].filter((d) => !installedDependencies[d]);

  const allDependenciesToInstall = [
    ...dependenciesToInstall,
    ...devDependenciesToInstall,
  ].sort((a, b) => a.localeCompare(b));

  if (allDependenciesToInstall.length === 0) {
    return;
  }

  const allDependenciesToInstallList = allDependenciesToInstall
    .map((d) => `\`${d}\``)
    .join(", ");

  spinner.start(`Installing the dependencies: ${allDependenciesToInstallList}`);

  const packageManager = await getPackageManager();
  const rootPath = await getRootPath();

  if (dependenciesToInstall.length > 0) {
    await packageManager.add(dependenciesToInstall, {
      cwd: rootPath,
    });
  }

  if (devDependenciesToInstall.length > 0) {
    await packageManager.add(devDependenciesToInstall, {
      dev: true,
      cwd: rootPath,
    });
  }

  spinner.succeed(
    `Installed the dependencies: ${allDependenciesToInstallList}`,
  );
}
