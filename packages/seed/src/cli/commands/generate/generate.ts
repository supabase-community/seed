import { type Argv } from "yargs";
import { type CodegenContext } from "#core/codegen/codegen.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { getDialect } from "#core/dialect/getDialect.js";
import { getFingerprint } from "#core/fingerprint/fingerprint.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
import { spinner } from "../../lib/output.js";
import { fetchShapeExamples } from "./fetchShapeExamples.js";
import { fetchShapePredictions } from "./fetchShapePredictions.js";

export function generateCommand(program: Argv) {
  return program.command(
    "generate",
    "Generates the assets needed by @snaplet/seed",
    (y) =>
      y.option("output", {
        alias: "o",
        describe: "A custom directory path to output the generated assets to",
        type: "string",
      }),
    async (args) => {
      const { generateAssets } = await import("#core/codegen/codegen.js");
      const context = await computeCodegenContext({ outputDir: args.output });
      await generateAssets(context);

      console.log("Done!");
    },
  );
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
    spinner.start("Predicting data labels...");
    shapePredictions = await fetchShapePredictions({
      determineShapeFromType: dialect.determineShapeFromType,
      dataModel,
    });
    spinner.succeed();

    spinner.start("Loading label examples...");
    shapeExamples = await fetchShapeExamples(shapePredictions);
    spinner.succeed();
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
