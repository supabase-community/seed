import {
  getDataModelConfigPath,
  setDataModelConfig,
} from "#config/dataModelConfig.js";
import { getDialectFromDatabaseUrl } from "#core/dialect/getDialectFromConnectionString.js";
import { link, spinner } from "../../lib/output.js";

export async function introspectHandler(args: {
  databaseUrl: string;
  silent?: boolean;
}) {
  const { databaseUrl } = args;

  if (!args.silent) {
    spinner.start("Introspecting your database");
  }

  const dialect = await getDialectFromDatabaseUrl(databaseUrl);

  const dataModel = await dialect.withDbClient({
    databaseUrl,
    fn: dialect.getDataModel,
  });

  await setDataModelConfig(dataModel);

  if (!args.silent) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dataModelConfigPath = (await getDataModelConfigPath())!;
    spinner.succeed(
      `Introspected ${Object.keys(dataModel.models).length} models and wrote them into ${link("dataModel.json", dataModelConfigPath)}`,
    );
  }

  return dataModel;
}
