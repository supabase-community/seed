import { type DMMF } from "@prisma/generator-helper";

export async function getPrismaDataModel(): Promise<DMMF.Document> {
  const prismaInternals = await import("@prisma/internals");
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const { getDMMF, getSchema } = prismaInternals.default ?? prismaInternals;

  const datamodel = await getSchema();

  return getDMMF({
    datamodel,
  });
}
