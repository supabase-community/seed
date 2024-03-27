import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDotSnapletPath } from "#config/dotSnaplet.js";
import { type ShapePredictions } from "#core/predictions/types.js";
import { jsonStringify } from "#core/utils.js";

export async function setShapePredictions(shapePredictions: ShapePredictions) {
  const dotSnapletPath = await ensureDotSnapletPath();

  const shapePredictionsPath = join(dotSnapletPath, "shapePredictions.json");

  await writeFile(
    shapePredictionsPath,
    jsonStringify(shapePredictions, undefined, 2),
    "utf8",
  );
}
