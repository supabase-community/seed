import { Octokit } from "@octokit/rest";
import dayjs from "dayjs";
import { z } from "zod";
import { getGitHubRelease } from "./release-utils.mjs";

const env = z
  .object({
    GITHUB_TOKEN: z.string(),
    RELEASE_TAG: z.string(),
  })
  .parse(process.env);

const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

const release = await getGitHubRelease({
  githubToken: env.GITHUB_TOKEN,
  releaseTag: env.RELEASE_TAG,
});

const filename = `${dayjs().format("YYYYMMDDHHmmss")}-${env.RELEASE_TAG}.md`;

await octokit.repos.createOrUpdateFileContents({
  owner: "snaplet",
  repo: "docs",
  path: `releases/${filename}`,
  message: `Release notes for ${env.RELEASE_TAG}`,
  content: Buffer.from(release.body).toString("base64"),
  branch: "main",
});
