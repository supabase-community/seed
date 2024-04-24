import { type DMMF } from "@prisma/generator-helper";
import { getDMMF, getSchema } from "@prisma/internals";

export async function getPrismaDataModel(): Promise<DMMF.Document> {
  const datamodel = await getSchema();

  return getDMMF({
    datamodel,
  });
}
