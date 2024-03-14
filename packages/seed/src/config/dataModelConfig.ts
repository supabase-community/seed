import { pathExists } from "find-up";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type DataModel } from "#core/dataModel/types.js";
import { ensureDotSnapletPath, getDotSnapletPath } from "./dotSnaplet.js";

export async function getDataModelConfig() {
  let dataModelConfig: DataModel | null = null;

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const dataModelConfigPath = join(dotSnapletPath, "dataModel.json");
    if (await pathExists(dataModelConfigPath)) {
      dataModelConfig = JSON.parse(
        await readFile(dataModelConfigPath, "utf8"),
      ) as DataModel;
    }
  }

  return dataModelConfig;
}

export async function setDataModelConfig(dataModelConfig: DataModel) {
  const dotSnapletPath = await ensureDotSnapletPath();

  const dataModelConfigPath = join(dotSnapletPath, "dataModel.json");
  await writeFile(
    dataModelConfigPath,
    JSON.stringify(dataModelConfig, null, 2),
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
