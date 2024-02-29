import { type Argv } from "yargs";
import { spinner } from "#cli/lib/spinner.js";
import { getSnapletConfig } from "#config/snapletConfig/snapletConfig.js";
import { type CodegenContext } from "#core/codegen/codegen.js";
import { getAliasedDataModel } from "#core/dataModel/aliases.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { type DataModel } from "#core/dataModel/types.js";
import { getFingerprint } from "#core/fingerprint/fingerprint.js";
import { type Templates } from "#core/userModels/templates/types.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
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
      console.log(generateAssets(context));
    },
  );
}

const getTemplates = async (
  dataModel: DataModel,
): Promise<Templates> => {
  switch (dataModel.dialect) {
    case "postgres":
      return (await import("#dialects/postgres/userModels.js"))
        .SEED_PG_TEMPLATES;
    case "sqlite":
      return (await import("#dialects/sqlite/userModels.js"))
        .SEED_SQLITE_TEMPLATES;
    default:
      return {};
  }
};

async function computeCodegenContext(props: {
  outputDir: string | undefined;
}): Promise<CodegenContext> {
  const { outputDir } = props;

  const config = await getSnapletConfig();

  // todo(justinvdm, 28 Feb 2024):
  // https://linear.app/snaplet/issue/S-1902/npx-snapletseed-generate-account-for-select-config

  let dataModel = await getDataModel();
  dataModel = getAliasedDataModel(dataModel, config.seed?.alias);

  let shapePredictions: Array<TableShapePredictions> = [];
  let shapeExamples: Array<{ examples: Array<string>; shape: string }> = [];

  if (!process.env["SNAPLET_DISABLE_SHAPE_PREDICTION"]) {
    spinner.info("Predicting data labels...");
    shapePredictions = await fetchShapePredictions(dataModel);
    spinner.succeed();

    spinner.info("Loading label examples...");
    shapeExamples = await fetchShapeExamples(shapePredictions);
    spinner.succeed();
  }

  return {
    fingerprint: await getFingerprint(),
    dataModel,
    outputDir,
    shapePredictions,
    shapeExamples,
    templates: await getTemplates(dataModel),
  };
}
