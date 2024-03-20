import { gracefulExit } from "exit-hook";
import { getDatabaseClient } from "#adapters/getDatabaseClient.js";
import {
  getDataModelConfigPath,
  setDataModelConfig,
} from "#config/dataModelConfig.js";
import { getDialect } from "#dialects/getDialect.js";
import { link, spinner } from "../../lib/output.js";

export async function introspectHandler() {
  spinner.start(`Introspecting your database`);

  const dialect = await getDialect();
  const databaseClient = await getDatabaseClient();
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
  spinner.succeed(
    `Introspected ${Object.keys(dataModel.models).length} models and wrote them into ${link(dataModelConfigPath)}`,
  );
}
