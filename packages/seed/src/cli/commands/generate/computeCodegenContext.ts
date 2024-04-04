import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type CodegenContext } from "#core/codegen/codegen.js";
import { getDataModel, getRawDataModel } from "#core/dataModel/dataModel.js";
import { getFingerprint } from "#core/fingerprint/fingerprint.js";
import { getDataExamples } from "#core/predictions/shapeExamples/getDataExamples.js";
import { getShapePredictions } from "#core/predictions/shapePredictions/getShapePredictions.js";
import { getDialect } from "#dialects/getDialect.js";

export async function computeCodegenContext(props: {
  outputDir: string | undefined;
}): Promise<CodegenContext> {
  const { outputDir } = props;

  const rawDataModel = await getRawDataModel();
  const dataModel = await getDataModel();
  const seedConfig = await getSeedConfig();
  const dialect = await getDialect();

  return {
    seedConfig,
    fingerprint: await getFingerprint(),
    dataModel,
    rawDataModel,
    outputDir,
    shapePredictions: await getShapePredictions(),
    dataExamples: await getDataExamples(),
    dialect,
  };
}
