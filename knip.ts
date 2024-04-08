import { type KnipConfig } from "knip";
import { readFileSync } from "node:fs";

const optionalPeerDeps = Object.keys(
  (
    JSON.parse(readFileSync("./packages/seed/package.json", "utf8")) as {
      peerDependenciesMeta: Record<string, { optional: boolean }>;
    }
  ).peerDependenciesMeta,
);

const config: KnipConfig = {
  ignoreBinaries: ["nix"],
  ignoreDependencies: optionalPeerDeps.filter(
    (dep) => dep !== "@prisma/client",
  ),
  ignore: [
    "./packages/seed/src/index.ts",
    "knip.ts",
    "./packages/seed/e2e/npm-install-test/**/*",
  ],
};

export default config;
