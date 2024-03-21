import { execaSync } from "execa";
import { readPkg, writePkg } from "../src/core/version.js";

const seedPackage = readPkg<{ version: string }>();

// At this point we should alwas have the latest stable version of our package
console.log("Release alpha version for ", seedPackage.version);
// We append "alpha" to the current version so it doesn't take over the stable version by semver rules
const alphaVersion = `${seedPackage.version}-alpha`;
// We append the git hash to the alpha version if it is available so we can deploy multiples alpha versions on the same stable version
const gitAlphaVersion = process.env["GIT_HASH"]
  ? `${alphaVersion}-${process.env["GIT_HASH"]}`
  : alphaVersion;

// At this point our version will look like <latestStable>-alpha-<commithash>
seedPackage.version = gitAlphaVersion;
// Override the version in the package.json file with the new alpha version
// So it's the one that will be used in the build
writePkg(seedPackage);

try {
  console.log("Building alpha version:", gitAlphaVersion);
  // We build our new alpha version
  const result = execaSync("pnpm", ["build"], { stdio: "inherit" });
  if (result.exitCode === 0) {
    console.log("Alpha version built successfully");
    const packResult = execaSync("npm", ["pack"], { stdio: "pipe" });
    console.log(packResult.stdout);
    if (packResult.exitCode === 0) {
      console.log("Alpha version packed successfully");
      console.log("Releasing to npm with the alpha tag");
      const publishResult = execaSync(
        "npm",
        [
          "publish",
          // We tag the version as alpha on npm so we can always install the latest alpha via
          // npm install @snaplet/seed@alpha
          "--tag=alpha",
          "--access=public",
          `snaplet-seed-${gitAlphaVersion}.tgz`,
        ],
        {
          stdio: "inherit",
        },
      );
      if (publishResult.exitCode === 0) {
        console.log("Alpha version published successfully");
      } else {
        throw new Error("Failed to publish alpha version", {
          cause: publishResult.stderr,
        });
      }
    } else {
      throw new Error("Failed to pack alpha version", {
        cause: packResult.stderr,
      });
    }
  } else {
    throw new Error("Failed to build alpha version", { cause: result.stderr });
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
