import { findUp } from "find-up";
import { mkdirp, writeFile } from "fs-extra";
import path from "node:path";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
import { type Templates } from "../userModels/templates/types.js";
import { generateUserModels } from "./userModels/generateUserModels.js";

export interface CodegenContext {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  outputDir?: string;
  shapeExamples: Array<{ examples: Array<string>; shape: string }>;
  shapePredictions: Array<TableShapePredictions>;
  templates: Templates;
}

const FILES = {
  PKG: {
    name: "package.json",
    template() {
      return `{
  "name": "__snaplet",
  "main": "index.js"
}`;
    },
  },
  INDEX: {
    name: "index.js",
    template() {
      return `
Object.defineProperty(exports, "__esModule", { value: true })

const { getSeedClient } = require("@snaplet/seed/dialects/postgres")

const dataModel = require("./${FILES.DATA_MODEL.name}")
const { userModels } = require("./${FILES.USER_MODELS.name}")

exports.createSeedClient = getSeedClient({ dataModel, userModels })
`;
    },
  },
  TYPEDEFS: {
    name: "index.d.ts",
    template() {
      // todo(justinvdm, 28 February 2024):
      // https://linear.app/snaplet/issue/S-1895/npx-snapletseed-generate-generate-types
      //return generateClientTypes({});
      return "";
    },
  },
  DATA_MODEL: {
    name: "dataModel.json",
    template({ dataModel }: CodegenContext) {
      // todo(justinvdm, 28 February 2024): Aliases
      // https://linear.app/snaplet/issue/S-1896/npx-snapletseed-generate-apply-aliasing-to-data-model
      return JSON.stringify(dataModel);
    },
  },
  USER_MODELS: {
    name: "modelDefaults.js",
    template(context: CodegenContext) {
      return generateUserModels(context);
    },
  },
} as const;

const findPackageDirPath = async () => {
  const packagePath = await findUp("package.json");
  if (!packagePath) {
    throw new Error(
      "@snaplet/seed could not find a package.json for your project. We use this to decide where to generate assets. Either add a package.json for your project, or use the --output option when using `npx @snaplet/seed generate`",
    );
  }
  return path.resolve(path.dirname(packagePath), "node_modules", ".snaplet");
};

export const generateAssets = async (context: CodegenContext) => {
  const packageDirPath = context.outputDir ?? (await findPackageDirPath());
  await mkdirp(packageDirPath);

  for (const file of Object.values(FILES)) {
    const filePath = path.join(packageDirPath, file.name);
    await writeFile(filePath, file.template(context));
  }
};
