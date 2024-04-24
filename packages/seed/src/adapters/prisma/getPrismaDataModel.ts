import { getDMMF, getSchema } from "@prisma/internals";
import { type DMMF } from "@prisma/generator-helper"

export async function getPrismaDataModel(): Promise<DMMF.Document> {
  const datamodel = await getSchema();

  return getDMMF({
    datamodel,
  });
}
