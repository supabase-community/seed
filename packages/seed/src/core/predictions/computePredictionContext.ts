import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { getDialect } from "#dialects/getDialect.js";
import { columnsToPredict } from "./utils.js";

export const computePredictionContext = async () => {
  const dataModel = await getDataModel();
  const dialect = await getDialect();
  const seedConfig = await getSeedConfig();

  const columns = columnsToPredict(
    dataModel,
    dialect.determineShapeFromType,
    seedConfig.fingerprint ?? {},
  );

  return {
    dataModel,
    columns,
  };
};
