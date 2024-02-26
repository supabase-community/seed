import { type DataModel } from "#core/dataModel/types.js";
import { type DrizzleORMPgClient } from "./adapters.js";
import { introspectDatabase } from "./introspect/introspectDatabase.js";
import { introspectionToDataModel } from "./introspect/introspectionToDataModel.js";

export async function getDatamodel(
  _db: DrizzleORMPgClient,
): Promise<DataModel> {
  const introspection = await introspectDatabase(_db);
  const dataModel = introspectionToDataModel(introspection);
  return dataModel;
}
