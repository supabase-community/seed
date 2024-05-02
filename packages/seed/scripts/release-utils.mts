import { Octokit } from "@octokit/rest";
import dayjs from "dayjs";
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

export async function getGitHubRelease(props: {
  githubToken: string;
  releaseTag: string;
}) {
  const octokit = new Octokit({ auth: props.githubToken });

  const release = await octokit.repos.getReleaseByTag({
    owner: "snaplet",
    repo: "seed",
    tag: props.releaseTag,
  });

  const publishedAt = dayjs(release.data.published_at);

  const title = `## ${release.data.tag_name} - ${publishedAt.format("DD MMM YYYY")}`;

  const body = [title, release.data.body].join("\n\n");

  return {
    body,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    publishedAt: release.data.published_at!,
    tagName: release.data.tag_name,
  };
}
