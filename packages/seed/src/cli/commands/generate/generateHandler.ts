import { relative } from "node:path";
import { type CodegenContext, generateAssets } from "#core/codegen/codegen.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { getDialect } from "#core/dialect/getDialect.js";
import { getFingerprint } from "#core/fingerprint/fingerprint.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
import { bold, dim, spinner } from "../../lib/output.js";
import { fetchShapeExamples } from "./fetchShapeExamples.js";
import { fetchShapePredictions } from "./fetchShapePredictions.js";

export async function generateHandler(args: { output?: string }) {
  const context = await computeCodegenContext({ outputDir: args.output });
  spinner.start(`Generating ${bold("Seed Client")}`);
  const outputDir = relative(process.cwd(), await generateAssets(context));
  spinner.succeed(`Generated ${bold("Seed Client")} ${dim(`to ${outputDir}`)}`);
}

async function computeCodegenContext(props: {
  outputDir: string | undefined;
}): Promise<CodegenContext> {
  const { outputDir } = props;

  const dataModel = await getDataModel();
  const dialect = await getDialect(dataModel.dialect);
  let shapePredictions: Array<TableShapePredictions> = [];
  let shapeExamples: Array<{ examples: Array<string>; shape: string }> = [];

  if (!process.env["SNAPLET_DISABLE_SHAPE_PREDICTION"]) {
    spinner.start("Getting your models shapes for enhanced data generation 🤖");
    shapePredictions = await fetchShapePredictions({
      determineShapeFromType: dialect.determineShapeFromType,
      dataModel,
    });
    shapeExamples = await fetchShapeExamples(shapePredictions);
    spinner.succeed("Got your models shapes for enhanced data generation 🤖");
  }

  return {
    fingerprint: await getFingerprint(),
    dataModel,
    outputDir,
    shapePredictions,
    shapeExamples,
    dialect,
  };
}
