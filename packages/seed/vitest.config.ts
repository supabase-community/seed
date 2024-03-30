import { transform } from "esbuild";
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
  },
  plugins: [
    // add support for "using" in test files
    {
      name: "esbuild-transform",
      async transform(code, id) {
        if (id.endsWith(".test.ts")) {
          code = (
            await transform(code, {
              target: "es2022",
            })
          ).code;
        }
        return code;
      },
    },
  ],
});
