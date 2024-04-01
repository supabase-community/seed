import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as {
  name: string;
};

export default defineProject({
  test: {
    name: pkg.name,
    root,
    testTimeout: 120_000,
    maxConcurrency: 7,
  },
  esbuild: {
    target: "es2022",
  },
});
