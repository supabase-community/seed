import { type DMMF } from "@prisma/generator-helper";

export async function getPrismaDataModel(): Promise<DMMF.Document> {
  const prismaInternals = await import("@prisma/internals");
  const { getDMMF, getSchema } = prismaInternals.default;

  const datamodel = await getSchema();

  return getDMMF({
    datamodel,
  });
}
