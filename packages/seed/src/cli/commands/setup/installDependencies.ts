import { introspectProject } from "#config/utils.js";
import { type Driver } from "#dialects/types.js";
import { spinner } from "../../lib/output.js";

export async function installDependencies({ driver }: { driver: Driver }) {
  const { packageManager, rootPath, packageJson } = await introspectProject();

  const allDependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };

  const devDependenciesToInstall = [
    "@snaplet/copycat",
    "@snaplet/seed",
    driver.package,
    ...("definitelyTyped" in driver &&
    driver.definitelyTyped !== undefined &&
    packageJson.devDependencies?.[driver.definitelyTyped] === undefined
      ? [driver.definitelyTyped]
      : []),
  ].filter((d) => !allDependencies[d]);

  if (devDependenciesToInstall.length === 0) {
    return;
  }

  spinner.start(
    `Installing the dependencies: ${devDependenciesToInstall.map((d) => `\`${d}\``).join(", ")}`,
  );

  await packageManager.add(devDependenciesToInstall, {
    dev: true,
    cwd: rootPath,
  });

  spinner.succeed(
    `Installed the dependencies: ${devDependenciesToInstall.map((d) => `\`${d}\``).join(", ")}`,
  );
}
