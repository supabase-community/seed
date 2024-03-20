import { type KnipConfig } from "knip";
import { readFileSync } from "node:fs";

const seedPackageJson = JSON.parse(
  readFileSync("./packages/seed/package.json", "utf8"),
) as { peerDependenciesMeta: Record<string, { optional: boolean }> };

const config: KnipConfig = {
  ignoreBinaries: ["nix"],
  ignoreDependencies: Object.keys(seedPackageJson.peerDependenciesMeta),
};

export default config;
