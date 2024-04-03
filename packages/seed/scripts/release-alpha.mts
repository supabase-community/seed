import semver from "semver";
import { readPkg, writePkg } from "../src/core/version.js";
import { releaseSnapletSeed } from "./release-utils.mjs";

const seedPackage = readPkg<{ version: string }>();

// We bump the alpha to the next minor version
const nextMinorVersion = semver.inc(seedPackage.version, "minor");
// We append "alpha" to the current version so it doesn't take over the stable version by semver rules
const alphaVersion = `${nextMinorVersion}-alpha`;
// We append the git hash to the alpha version if it is available so we can deploy multiples alpha versions on the same stable version
const gitAlphaVersion = process.env["GIT_HASH"]
  ? `${alphaVersion}-${process.env["GIT_HASH"]}`
  : alphaVersion;

// At this point our version will look like <latestStable>-alpha-<commithash>
seedPackage.version = gitAlphaVersion;
// Override the version in the package.json file with the new alpha version
// So it's the one that will be used in the build
writePkg(seedPackage);
const versionToRelease = gitAlphaVersion;
const channel = "alpha";

try {
  releaseSnapletSeed({ versionToRelease, channel, dryRun: true });
  process.exit(0);
} catch (error) {
  process.exit(1);
}
