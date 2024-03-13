import { setDataModelConfig } from "#config/dataModelConfig.js";
import { getDialectFromConnectionString } from "#core/dialect/getDialectFromConnectionString.js";
import { spinner } from "../../lib/output.js";

export async function introspectHandler(args: { connectionString: string }) {
  const { connectionString } = args;
  spinner.start("Introspecting...");

  const dialect = await getDialectFromConnectionString(connectionString);

  const dataModel = await dialect.withDbClient({
    connectionString,
    fn: dialect.getDataModel,
  });

  await setDataModelConfig(dataModel);

  spinner.succeed();
  console.log("Done!");
}
