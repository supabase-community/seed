import { introspectProject } from "#config/utils.js";
import { spinner } from "../../lib/output.js";

export async function installDependencies() {
  const { packageManager, rootPath, packageJson } = await introspectProject();

  const allDependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };

  const devDependenciesToInstall = ["@snaplet/copycat", "@snaplet/seed"].filter(
    (d) => !allDependencies[d],
  );

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
