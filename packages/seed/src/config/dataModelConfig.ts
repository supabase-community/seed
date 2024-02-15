import { findUp, pathExists } from "find-up";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type DataModel } from "#core/dataModel/types.js";

export async function getDataModelConfig() {
  let dataModelConfig: DataModel | null = null;

  const dotSnapletPath = await findUp(".snaplet");

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
  let dotSnapletPath = await findUp(".snaplet");

  if (!dotSnapletPath) {
    dotSnapletPath = join(process.cwd(), ".snaplet");
    await mkdir(dotSnapletPath);
  }

  const dataModelConfigPath = join(dotSnapletPath, "dataModel.json");
  await writeFile(
    dataModelConfigPath,
    JSON.stringify(dataModelConfig, null, 2),
    "utf8",
  );
}
