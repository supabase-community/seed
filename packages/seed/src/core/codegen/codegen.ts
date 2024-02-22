import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type TableShapePredictions } from "#trpc/shapes.js";
import { generateUserModels } from "./generateUserModels.js";

export interface CodegenContext {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  outputDir?: string;
  shapePredictions: Array<TableShapePredictions>;
}

interface CodegenTemplate {
  name: string;
  template: (context: CodegenContext) => Promise<string> | string;
}

const FILES = {
  PKG: {
    name: "package.json",
    template() {
      return `{
  "name": ".snaplet",
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
      // TODO
      //return generateClientTypes({});
      return "";
    },
  },
  DATA_MODEL: {
    name: "dataModel.json",
    template({ dataModel }) {
      return JSON.stringify(dataModel);
    },
  },
  USER_MODELS: {
    name: "modelDefaults.js",
    template(context) {
      return generateUserModels(context);
    },
  },
};

export function generateAssets() {
  // todo
}
