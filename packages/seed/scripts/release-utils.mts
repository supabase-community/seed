import { execaSync } from "execa";

export function releaseSnapletSeed({
  versionToRelease,
  channel,
  dryRun,
}: {
  channel: string;
  dryRun: boolean;
  versionToRelease: string;
}) {
  try {
    console.log(`Building ${channel} version: ${versionToRelease}`);
    // We build our new alpha version
    const result = execaSync("pnpm", ["build"], { stdio: "inherit" });
    if (result.exitCode === 0) {
      console.log(`${channel} version built successfully`);
      const packResult = execaSync("npm", ["pack"], { stdio: "pipe" });
      console.log(packResult.stdout);
      if (packResult.exitCode === 0) {
        console.log(`${channel} version packed successfully`);
        console.log(`Releasing to npm on channel: ${channel}`);
        const publishOptions = [
          "publish",
          `--tag=${channel}`,
          "--access=public",
          `snaplet-seed-${versionToRelease}.tgz`,
        ];
        if (dryRun) {
          publishOptions.push("--dry-run");
        }
        const publishResult = execaSync("npm", publishOptions, {
          stdio: "inherit",
        });
        if (publishResult.exitCode === 0) {
          console.log(`${channel} version published successfully`);
        } else {
          throw new Error(
            `Failed to publish ${versionToRelease} on channel ${channel}`,
            {
              cause: publishResult.stderr,
            },
          );
        }
      } else {
        throw new Error(
          `Failed to pack ${versionToRelease} on channel ${channel}`,
          {
            cause: packResult.stderr,
          },
        );
      }
    } else {
      throw new Error(`Failed to build ${versionToRelease}`, {
        cause: result.stderr,
      });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
