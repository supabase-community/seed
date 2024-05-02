import dedent from "dedent";
import { pathToFileURL } from "node:url";
import { getDatabaseClient } from "#adapters/getDatabaseClient.js";
import {
  getDataModelConfigPath,
  setDataModelConfig,
} from "#config/dataModelConfig.js";
import { getDialect } from "#dialects/getDialect.js";
import { dim, link, spinner } from "../../lib/output.js";

export async function introspectHandler() {
  try {
    spinner.start(`Analysing your database structure 🔍`);

    const dialect = await getDialect();
    const databaseClient = await getDatabaseClient();
    const dataModel = await dialect.getDataModel(databaseClient);

    if (Object.keys(dataModel.models).length === 0) {
      throw new Error(
        "No tables found in the database, please make sure the database is not empty",
      );
    }

    await setDataModelConfig(dataModel);

    // we know the path exists because we just called `setDataModelConfig`
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dataModelConfigPath = (await getDataModelConfigPath())!;
    spinner.succeed(
      dedent`
    Database structure analyzed, data model saved to: ${link(pathToFileURL(dataModelConfigPath).toString())}

    ${dim("The data model represents the structure of your database, and is used by Seed to generate realistic data 🔍")}
  ` + "\n",
    );
    return { ok: true };
  } catch (error) {
    spinner.fail(`Database analysis failed`);
    throw error;
  }
}
