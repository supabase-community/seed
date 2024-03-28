import { readPkg } from "../src/core/version.js";
import { releaseSnapletSeed } from "./release-utils.mjs";

const seedPackage = readPkg<{ version: string }>();
const versionToRelease = seedPackage.version;
const channel = "latest";

try {
  releaseSnapletSeed({ versionToRelease, channel, dryRun: true });
  process.exit(0);
} catch (error) {
  process.exit(1);
}
