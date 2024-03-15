import { gracefulExit } from "exit-hook";
import { relative, sep } from "node:path";
import {
  getDataModelConfigPath,
  setDataModelConfig,
} from "#config/dataModelConfig.js";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDatabaseClient } from "#dialects/getDatabaseClient.js";
import { getDialectFromDriverId } from "#dialects/getDialect.js";
import { link, spinner } from "../../lib/output.js";

export async function introspectHandler() {
  spinner.start("Introspecting the database");

  const seedConfig = await getSeedConfig();
  const dialect = getDialectFromDriverId(seedConfig.databaseClient.driver);
  const databaseClient = await getDatabaseClient(seedConfig.databaseClient);

  const dataModel = await dialect.getDataModel(databaseClient);

  if (Object.keys(dataModel.models).length === 0) {
    spinner.fail(
      "No tables found in the database, please make sure the database is not empty",
    );
    gracefulExit(1);
  }

  await setDataModelConfig(dataModel);

  // we know the path exists because we just called `setDataModelConfig`
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dataModelConfigPath = (await getDataModelConfigPath())!;
  const relativeDataModelConfigPath = `.${sep}${relative(process.cwd(), dataModelConfigPath)}`;
  spinner.succeed(
    `Introspected ${Object.keys(dataModel.models).length} models and wrote them into ${link(relativeDataModelConfigPath, dataModelConfigPath)}`,
  );

  return dataModel;
}
