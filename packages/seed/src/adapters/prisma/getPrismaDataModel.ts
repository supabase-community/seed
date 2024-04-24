import { getDMMF, getSchema } from "@prisma/internals";

export async function getPrismaDataModel() {
  const datamodel = await getSchema();

  return getDMMF({
    datamodel,
  });
}
