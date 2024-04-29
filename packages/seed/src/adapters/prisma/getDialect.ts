export async function getDialect() {
  const { getConfig, getSchema } = (await import("@prisma/internals")).default;

  const config = await getConfig({
    datamodel: await getSchema(),
  });

  const provider = config.datasources.at(0)?.provider;

  switch (provider) {
    case "mysql":
      return "mysql";
    case "postgres":
    case "postgresql":
      return "postgres";
    case "sqlite":
      return "sqlite";
    default:
      throw new Error(`Unsupported Prisma provider ${provider}`);
  }
}
