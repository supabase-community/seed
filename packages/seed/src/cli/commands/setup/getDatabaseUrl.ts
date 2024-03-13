import prompt from "prompts";
import { getProjectConfig } from "#config/projectConfig.js";

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

  return databaseUrl;
}
