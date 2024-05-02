import { Octokit } from "@octokit/core";
import dayjs from "dayjs";
import { z } from "zod";

interface ReleaseNotes {
  content: string;
  docsLink: string;
}

const env = z
  .object({
    GITHUB_TOKEN: z.string(),
    RELEASE_TAG: z.string(),
    DISCORD_WEBHOOK_URL: z.string(),
  })
  .parse(process.env);

const releaseNotes = await getReleaseNotes();

await publishToSnapletDocs(releaseNotes);

await publishToDiscord(releaseNotes);

async function getReleaseNotes() {
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

  const release = await octokit.request(
    "GET /repos/{owner}/{repo}/releases/tags/{tag}",
    {
      owner: "snaplet",
      repo: "seed",
      tag: env.RELEASE_TAG,
    },
  );

  const publishedAt = dayjs(release.data.published_at);

  // example: #v0970---30-april-2024
  const anchor =
    `#${release.data.tag_name.replaceAll(".", "")}---${publishedAt.format("DD-MMMM-YYYY")}`.toLowerCase();

  const docsLink = `https://docs.snaplet.dev/seed/release-notes${anchor}`;

  const title = `## ${release.data.tag_name} - ${publishedAt.format("DD MMM YYYY")}`;

  const content = [title, release.data.body].join("\n\n");

  return {
    docsLink,
    content,
  };
}

async function publishToSnapletDocs(releaseNotes: ReleaseNotes) {}

async function publishToDiscord(releaseNotes: ReleaseNotes) {
  // patch code blocks because Discord support is not great
  let content = releaseNotes.content
    .replace(/```(\w+).+$/gm, "```$1")
    .replace(/\s+```/gm, "\n```");

  if (releaseNotes.content.length > 2000) {
    const readMore = `[Read more](${releaseNotes.docsLink})`;
    const extraContent = `...\n\n${readMore}`;
    content = [content.slice(0, 2000 - extraContent.length), extraContent].join(
      "",
    );
  }

  await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });
}
