import { defineConfig, recommended } from "@snaplet/eslint-config";

export default defineConfig([
  {
    ignores: ["**/{.devenv,.direnv,apps,node_modules,packages,docs}"],
  },
  ...recommended,
]);
