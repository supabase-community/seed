import { introspectProject } from "#config/utils.js";
import { type Adapter } from "#dialects/types.js";
import { spinner } from "../../lib/output.js";

export async function installDependencies({ adapter }: { adapter: Adapter }) {
  const { packageManager, rootPath, packageJson } = await introspectProject();

  const allDependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };

  const devDependenciesToInstall = [
    "@snaplet/copycat",
    "@snaplet/seed",
    adapter.package,
    ...("definitelyTyped" in adapter &&
    adapter.definitelyTyped !== undefined &&
    packageJson.devDependencies?.[adapter.definitelyTyped] === undefined
      ? [adapter.definitelyTyped]
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
