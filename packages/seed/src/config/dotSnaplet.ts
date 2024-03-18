import { findUp } from "find-up";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getRootPath } from "./utils.js";

export async function getDotSnapletPath() {
  const path = await findUp(".snaplet", {
    type: "directory",
  });

  return path;
}

export async function ensureDotSnapletPath() {
  let dotSnapletPath = await getDotSnapletPath();

  if (!dotSnapletPath) {
    dotSnapletPath = join(await getRootPath(), ".snaplet");
    await mkdir(dotSnapletPath);
  }

  return dotSnapletPath;
}
