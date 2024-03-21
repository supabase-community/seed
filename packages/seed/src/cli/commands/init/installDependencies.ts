import {
  getInstalledDependencies,
  getPackageManager,
  getRootPath,
} from "#config/utils.js";
import { getVersion } from "#core/version.js";
import { spinner } from "../../lib/output.js";

export async function installDependencies() {
  const installedDependencies = await getInstalledDependencies();

  const devDependenciesToInstall = [
    "@snaplet/copycat",
    `@snaplet/seed@${getVersion()}`,
  ].filter((d) => !installedDependencies[d]);

  if (devDependenciesToInstall.length === 0) {
    return;
  }

  spinner.start(
    `Installing the dependencies: ${devDependenciesToInstall.map((d) => `\`${d}\``).join(", ")}`,
  );

  const packageManager = await getPackageManager();
  const rootPath = await getRootPath();

  await packageManager.add(devDependenciesToInstall, {
    dev: true,
    cwd: rootPath,
  });

  spinner.succeed(
    `Installed the dependencies: ${devDependenciesToInstall.map((d) => `\`${d}\``).join(", ")}`,
  );
}
