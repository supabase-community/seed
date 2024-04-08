import { defineConfig, recommended } from "@snaplet/eslint-config";

export default defineConfig([
  ...recommended,
  {
    ignores: ["e2e/npm-install-test/**"],
  },
]);
