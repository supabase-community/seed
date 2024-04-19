import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type DataModel } from "#core/dataModel/types.js";
import { SnapletError, jsonStringify } from "#core/utils.js";
import { ensureDotSnapletPath, getDotSnapletPath } from "./dotSnaplet.js";

export async function getDataModelConfig() {
  let dataModelConfig: DataModel | null = null;

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const dataModelConfigPath = join(dotSnapletPath, "dataModel.json");
    if (existsSync(dataModelConfigPath)) {
      try {
        dataModelConfig = JSON.parse(
          await readFile(dataModelConfigPath, "utf8"),
        ) as DataModel;
      } catch (error) {
        throw new SnapletError("SEED_DATA_MODEL_INVALID", {
          path: dataModelConfigPath,
          error: error as Error,
        });
      }
    }
  }

  return dataModelConfig;
}

export async function setDataModelConfig(dataModelConfig: DataModel) {
  const dotSnapletPath = await ensureDotSnapletPath();

  const dataModelConfigPath = join(dotSnapletPath, "dataModel.json");
  await writeFile(
    dataModelConfigPath,
    jsonStringify(dataModelConfig, undefined, 2),
    "utf8",
  );
}

export async function getDataModelConfigPath() {
  const dotSnapletPath = await getDotSnapletPath();
  if (!dotSnapletPath) {
    return null;
  }
  return join(dotSnapletPath, "dataModel.json");
}
