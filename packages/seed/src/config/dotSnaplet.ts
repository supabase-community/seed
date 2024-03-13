import { findUp } from "find-up";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export async function getDotSnapletPath() {
  const path = await findUp(".snaplet", {
    type: "directory",
  });

  return path;
}

export async function ensureDotSnapletPath() {
  let dotSnapletPath = await getDotSnapletPath();

  if (!dotSnapletPath) {
    dotSnapletPath = join(process.cwd(), ".snaplet");
    await mkdir(dotSnapletPath);
  }

  return dotSnapletPath;
}
