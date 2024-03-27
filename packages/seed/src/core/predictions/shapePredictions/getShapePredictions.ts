import { pathExists } from "fs-extra/esm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDotSnapletPath } from "#config/dotSnaplet.js";
import { type ShapePredictions } from "../types.js";

export async function getShapePredictions(): Promise<ShapePredictions> {
  let shapePredictions: ShapePredictions = [];

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const shapePredictionsPath = join(dotSnapletPath, "shapePredictions.json");

    if (await pathExists(shapePredictionsPath)) {
      shapePredictions = JSON.parse(
        await readFile(shapePredictionsPath, "utf8"),
      ) as ShapePredictions;
    }
  }

  return shapePredictions;
}
