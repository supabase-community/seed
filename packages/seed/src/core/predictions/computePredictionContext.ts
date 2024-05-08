import {
  getProjectConfig,
  getProjectConfigPath,
} from "#config/project/projectConfig.js";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { SnapletError } from "#core/utils.js";
import { getDialect } from "#dialects/getDialect.js";
import { columnsToPredict, formatInput } from "./utils.js";

export type PredictionContext = Awaited<
  ReturnType<typeof computePredictionContext>
>;

export const computePredictionContext = async () => {
  const projectId = (await getProjectConfig()).projectId;

  if (!projectId) {
    throw new SnapletError("SNAPLET_PROJECT_CONFIG_NOT_FOUND", {
      path: await getProjectConfigPath(),
    });
  }

  const dataModel = await getDataModel();
  const dialect = await getDialect();
  const seedConfig = await getSeedConfig();

  const columns = columnsToPredict(
    dataModel,
    dialect.determineShapeFromType,
    seedConfig.fingerprint ?? {},
  );

  const inputs = columns.map((column) =>
    formatInput([column.schemaName, column.tableName, column.columnName]),
  );

  return {
    projectId,
    dataModel,
    columns,
    inputs,
  };
};
