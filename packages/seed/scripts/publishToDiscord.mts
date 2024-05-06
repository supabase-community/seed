import dayjs from "dayjs";
import { z } from "zod";
import { getGitHubRelease } from "./release-utils.mjs";

const env = z
  .object({
    GITHUB_TOKEN: z.string(),
    RELEASE_TAG: z.string(),
    DISCORD_WEBHOOK_URL: z.string(),
  })
  .parse(process.env);

const release = await getGitHubRelease({
  githubToken: env.GITHUB_TOKEN,
  releaseTag: env.RELEASE_TAG,
});

// patch code blocks because Discord support is not great
let content = release.body
  .replace(/```(\w+).+$/gm, "```$1")
  .replace(/\s+```/gm, "\n```");

if (content.length > 2000) {
  // example: #v0970---30-april-2024
  const anchor =
    `#${release.tagName.replaceAll(".", "")}---${dayjs(release.publishedAt).format("DD-MMMM-YYYY")}`.toLowerCase();
  const docsLink = `https://docs.snaplet.dev/seed/release-notes${anchor}`;
  const readMore = `[Read more](${docsLink})`;
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
