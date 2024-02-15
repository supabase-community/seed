import { findUp, pathExists } from "find-up";
import { readFile } from "node:fs/promises";
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
