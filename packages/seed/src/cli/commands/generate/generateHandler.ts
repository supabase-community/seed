import { cliTelemetry } from "#cli/lib/cliTelemetry.js";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type CodegenContext, generateAssets } from "#core/codegen/codegen.js";
import { getDataModel, getRawDataModel } from "#core/dataModel/dataModel.js";
import { getFingerprint } from "#core/fingerprint/fingerprint.js";
import { getDialect } from "#dialects/getDialect.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
import { bold, link, spinner } from "../../lib/output.js";
import { fetchShapeExamples } from "./fetchShapeExamples.js";
import { fetchShapePredictions } from "./fetchShapePredictions.js";

export async function generateHandler(args: { output?: string }) {
  spinner.start(`Generating your ${bold("Seed Client")}`);

  await cliTelemetry.captureEvent("$command:generate:start");

  const context = await computeCodegenContext({ outputDir: args.output });

  const outputDir = await generateAssets(context);
  spinner.succeed(
    `Generated your ${bold("Seed Client")} to ${link(outputDir)}`,
  );
  spinner.info(
    `You might want to reload your TypeScript Server to pick up the changes`,
  );

  await cliTelemetry.captureEvent("$command:generate:end");
}

async function computeCodegenContext(props: {
  outputDir: string | undefined;
}): Promise<CodegenContext> {
  const { outputDir } = props;

  const rawDataModel = await getRawDataModel();
  const dataModel = await getDataModel();
  const seedConfig = await getSeedConfig();
  const dialect = await getDialect();

  let shapePredictions: Array<TableShapePredictions> = [];
  let shapeExamples: Array<{ examples: Array<string>; shape: string }> = [];

  if (!process.env["SNAPLET_DISABLE_SHAPE_PREDICTION"]) {
    spinner.start("Getting the models' shapes for enhanced data generation 🤖");
    shapePredictions = await fetchShapePredictions({
      determineShapeFromType: dialect.determineShapeFromType,
      dataModel,
    });
    shapeExamples = await fetchShapeExamples(shapePredictions);
    spinner.succeed("Got the models' shapes for enhanced data generation 🤖");
  }

  return {
    seedConfig,
    fingerprint: await getFingerprint(),
    dataModel,
    rawDataModel,
    outputDir,
    shapePredictions,
    shapeExamples,
    dialect,
  };
}
