import { type Argv } from "yargs";
import { getSnapletConfig } from "#config/snapletConfig/snapletConfig.js";
import { getAliasedDataModel } from "#core/dataModel/aliases.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
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
      console.log(generateAssets());
    },
  );
}

async function computeCodegenContext(props: { outputDir: string | undefined }) {
  const { outputDir } = props;

  const config = await getSnapletConfig();

  // todo(justinvdm, 28 Feb 2024):
  // https://linear.app/snaplet/issue/S-1902/npx-snapletseed-generate-account-for-select-config

  let dataModel = await getDataModel();
  dataModel = getAliasedDataModel(dataModel, config.seed?.alias);

  let shapePredictions: Array<TableShapePredictions> = [];
  let shapeExamples: Array<{ examples: Array<string>; shape: string }> = [];

  if (!process.env["SNAPLET_DISABLE_SHAPE_PREDICTION"]) {
    const actLabeling = activity("Labeling", "Predicting data labels...");
    shapePredictions = await fetchShapePredictions(dataModel, actLabeling);
    actLabeling.pass();
    xd("shape predictions", shapePredictions);
    const actExamples = activity("Examples", "Loading label examples...");
    shapeExamples = await fetchShapeExamples(shapePredictions);
    actExamples.pass();
  }

  return {
    fingerprint: readFingerprint(),
    dataModel,
    outputDir,
    introspection: structure,
    shapePredictions,
    shapeExamples,
    isCopycatNext,
  };
}
