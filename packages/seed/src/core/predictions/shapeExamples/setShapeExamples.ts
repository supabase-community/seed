import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDotSnapletPath } from "#config/dotSnaplet.js";
import { type ShapeExamples } from "#core/predictions/types.js";
import { jsonStringify } from "#core/utils.js";

export async function setShapeExamples(shapeExamples: ShapeExamples) {
  const dotSnapletPath = await ensureDotSnapletPath();

  const shapeExamplesPath = join(dotSnapletPath, "shapeExamples.json");

  await writeFile(
    shapeExamplesPath,
    jsonStringify(shapeExamples, undefined, 2),
    "utf8",
  );
}
