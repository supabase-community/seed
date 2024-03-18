import { relative, sep } from "node:path";
import { cliTelemetry } from "#cli/lib/cliTelemetry.js";
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

  spinner.start("Introspecting the database");

  await cliTelemetry.captureEvent("$command:introspect:start");

  const dialect = await getDialectFromDatabaseUrl(databaseUrl);

  const dataModel = await dialect.withDbClient({
    databaseUrl,
    fn: dialect.getDataModel,
  });

  if (Object.keys(dataModel.models).length === 0) {
    spinner.fail(
      "No tables found in the database, please make sure the database is not empty",
    );
    process.exit(1);
  }

  await setDataModelConfig(dataModel);

  // we know the path exists because we just called `setDataModelConfig`
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dataModelConfigPath = (await getDataModelConfigPath())!;
  const relativeDataModelConfigPath = `.${sep}${relative(process.cwd(), dataModelConfigPath)}`;
  spinner.succeed(
    `Introspected ${Object.keys(dataModel.models).length} models and wrote them into ${link(relativeDataModelConfigPath, dataModelConfigPath)}`,
  );

  await cliTelemetry.captureEvent("$command:introspect:end");

  return dataModel;
}
