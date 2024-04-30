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
    retry: process.env["CI"] ? 1 : 0, // Retry failed tests once in CI in case of flakiness due to parrallelization
    name: pkg.name,
    root,
    testTimeout: 120_000,
    sequence: {
      shuffle: false,
    },
    setupFiles: ["dotenv/config"],
  },
  esbuild: {
    target: "es2022",
  },
});
