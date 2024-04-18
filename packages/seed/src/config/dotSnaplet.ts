import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getSeedConfigPath } from "./seedConfig/seedConfig.js";

export async function getDotSnapletPath() {
  const seedConfigDirectory = dirname(await getSeedConfigPath());

  return join(seedConfigDirectory, ".snaplet");
}

export async function dotSnapletPathExists() {
  return existsSync(await getDotSnapletPath());
}

export async function ensureDotSnapletPath() {
  let dotSnapletPath = await getDotSnapletPath();

  if (!dotSnapletPath || !existsSync(dotSnapletPath)) {
    await mkdir(dotSnapletPath, { recursive: true });
  }

  return dotSnapletPath;
}
