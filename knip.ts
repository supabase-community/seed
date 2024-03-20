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
  ignoreDependencies: optionalPeerDeps,
  ignore: ["./packages/seed/src/index.ts", "knip.ts"],
};

export default config;
