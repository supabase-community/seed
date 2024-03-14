import { relative, sep } from "node:path";
import prompt from "prompts";
import {
  getProjectConfig,
  getProjectConfigPath,
  updateProjectConfig,
} from "#config/projectConfig.js";
import { getDialectFromDatabaseUrl } from "#core/dialect/getDialectFromConnectionString.js";
import { link, spinner } from "../../lib/output.js";

export async function getDatabaseUrl() {
  const projectConfig = await getProjectConfig();

  if (projectConfig.targetDatabaseUrl) {
    return projectConfig.targetDatabaseUrl;
  }

  const { databaseUrl } = (await prompt({
    type: "text",
    name: "databaseUrl",
    message: "What is your database URL?",
    validate(value: string) {
      try {
        new URL(value);
        return true;
      } catch {
        return "Please enter a valid database URL";
      }
    },
  })) as { databaseUrl: string };

  // assert database connectivity
  const dialect = await getDialectFromDatabaseUrl(databaseUrl);
  try {
    await dialect.withDbClient({
      databaseUrl,
      fn: async (db) => {
        await db.query("SELECT 1");
      },
    });
  } catch (e) {
    spinner.fail(`Failed to connect to your database: ${(e as Error).message}`);
    process.exit(1);
  }

  await updateProjectConfig({ targetDatabaseUrl: databaseUrl });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const projectConfigPath = (await getProjectConfigPath())!;
  const relativeProjectConfigPath = `.${sep}${relative(process.cwd(), projectConfigPath)}`;
  spinner.succeed(
    `Wrote your database URL into ${link(relativeProjectConfigPath, projectConfigPath)}`,
  );

  return databaseUrl;
}
