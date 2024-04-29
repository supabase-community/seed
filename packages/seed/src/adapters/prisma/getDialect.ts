export async function getDialect() {
  const prismaInternals = await import("@prisma/internals");
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const { getConfig, getSchema } = prismaInternals.default ?? prismaInternals;

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
