import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getSeedConfigPath } from "./seedConfig/seedConfig.js";

export async function getDotSnapletPath() {
  const seedConfigDirectory = dirname(await getSeedConfigPath());

  return join(seedConfigDirectory, ".snaplet");
}

export async function ensureDotSnapletPath() {
  let dotSnapletPath = await getDotSnapletPath();

  if (!dotSnapletPath) {
    await mkdir(dotSnapletPath);
  }

  return dotSnapletPath;
}
