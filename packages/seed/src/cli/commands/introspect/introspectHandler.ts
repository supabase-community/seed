import { gracefulExit } from "exit-hook";
import { relative, sep } from "node:path";
import {
  getDataModelConfigPath,
  setDataModelConfig,
} from "#config/dataModelConfig.js";
import { getDatabaseClient } from "#dialects/getDatabaseClient.js";
import { getDialectById } from "#dialects/getDialect.js";
import { link, spinner } from "../../lib/output.js";

export async function introspectHandler() {
  spinner.start("Introspecting the database");

  const databaseClient = await getDatabaseClient();
  const dialect = getDialectById(databaseClient.dialect);
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
