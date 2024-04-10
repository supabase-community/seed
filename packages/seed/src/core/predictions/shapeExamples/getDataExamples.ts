import { pathExists } from "fs-extra/esm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDotSnapletPath } from "#config/dotSnaplet.js";
import { FILES } from "../../codegen/codegen.js";
import { type DataExample } from "../types.js";

export async function getDataExamples(): Promise<Array<DataExample>> {
  let dataExamples: Array<DataExample> = [];

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const dataExamplesPath = join(dotSnapletPath, FILES.DATA_EXAMPLES.name);

    if (await pathExists(dataExamplesPath)) {
      dataExamples = JSON.parse(
        await readFile(dataExamplesPath, "utf8"),
      ) as Array<DataExample>;
    }
  }

  return dataExamples;
}
