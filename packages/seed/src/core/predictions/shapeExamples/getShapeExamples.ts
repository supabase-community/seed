import { pathExists } from "fs-extra/esm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDotSnapletPath } from "#config/dotSnaplet.js";
import { type ShapeExamples } from "../types.js";

export async function getShapeExamples(): Promise<ShapeExamples> {
  let shapeExamples: ShapeExamples = [];

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const shapeExamplesPath = join(dotSnapletPath, "shapeExamples.json");

    if (await pathExists(shapeExamplesPath)) {
      shapeExamples = JSON.parse(
        await readFile(shapeExamplesPath, "utf8"),
      ) as ShapeExamples;
    }
  }

  return shapeExamples;
}
