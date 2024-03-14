import { findUp } from "find-up";
import { mkdirp } from "fs-extra/esm";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { type DataModel } from "#core/dataModel/types.js";
import { type Dialect } from "#core/dialect/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
import { generateUserModels } from "./userModels/generateUserModels.js";

export interface CodegenContext {
  dataModel: DataModel;
  dialect: Dialect;
  fingerprint: Fingerprint;
  outputDir?: string;
  shapeExamples: Array<{ examples: Array<string>; shape: string }>;
  shapePredictions: Array<TableShapePredictions>;
}

const FILES = {
  PKG: {
    name: "package.json",
    template() {
      return `{
  "name": "__snaplet",
  "type": "module",
  "exports": {
    "default": "./index.js",
    "types": "./index.d.ts"
  }
}`;
    },
  },
  INDEX: {
    name: "index.js",
    template({ dataModel }: CodegenContext) {
      return `
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getSeedClient } from "@snaplet/seed/dialects/${dataModel.dialect}/client";
import { userModels } from "./${FILES.USER_MODELS.name}";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataModel = JSON.parse(readFileSync(join(__dirname, "${FILES.DATA_MODEL.name}")));

export const createSeedClient = getSeedClient({ dataModel, userModels });
`;
    },
  },
  TYPEDEFS: {
    name: "index.d.ts",
    template({ dialect, dataModel, fingerprint }: CodegenContext) {
      return dialect.generateClientTypes({ dataModel, fingerprint });
    },
  },
  DATA_MODEL: {
    name: "dataModel.json",
    template({ dataModel }: CodegenContext) {
      return JSON.stringify(dataModel);
    },
  },
  USER_MODELS: {
    name: "userModels.js",
    template(context: CodegenContext) {
      return generateUserModels(context);
    },
  },
  SHAPE_EXAMPLES: {
    name: "shapeExamples.json",
    template({ shapeExamples }: CodegenContext) {
      return JSON.stringify(shapeExamples);
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
  return path.resolve(path.dirname(packagePath), "node_modules", "__snaplet");
};

export const generateAssets = async (context: CodegenContext) => {
  const packageDirPath = context.outputDir ?? (await findPackageDirPath());
  await mkdirp(packageDirPath);

  for (const file of Object.values(FILES)) {
    const filePath = path.join(packageDirPath, file.name);
    await writeFile(filePath, await file.template(context));
  }

  return packageDirPath;
};
