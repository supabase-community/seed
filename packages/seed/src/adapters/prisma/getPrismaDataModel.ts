import { type DMMF } from "@prisma/generator-helper";

export async function getPrismaDataModel(): Promise<DMMF.Document> {
  const { getDMMF, getSchema } = await import("@prisma/internals");

  const datamodel =await getSchema();

  return getDMMF({
    datamodel,
  });
}
