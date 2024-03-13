import prompt from "prompts";

export async function getDatabaseUrl() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { databaseUrl } = await prompt({
    type: "text",
    name: "databaseUrl",
    message: "Database URL:",
    hint: "postgresql://user:password@localhost:5432/postgres",
    // initial:
    //   projectConfig.targetDatabaseUrl || process.env.PGENV_CONNECTION_URL,
    validate(value: string) {
      return value.length > 0;
    },
  });

  return databaseUrl as string;
}
