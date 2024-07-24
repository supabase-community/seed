import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDotSnapletPath } from "#config/dotSnaplet.js";
import { type DataExample } from "#core/predictions/types.js";
import { jsonStringify } from "#core/utils.js";
import { FILES } from "../../codegen/codegen.js";

export async function setDataExamples(shapeExamples: Array<DataExample>) {
  const dotSnapletPath = await ensureDotSnapletPath();

  const shapeExamplesPath = join(dotSnapletPath, FILES.DATA_EXAMPLES.name);

  await writeFile(
    shapeExamplesPath,
    jsonStringify(shapeExamples, undefined, 2),
    "utf8",
  );
}
