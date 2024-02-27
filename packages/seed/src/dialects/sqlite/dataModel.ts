import { type DrizzleDbClient } from "#core/adapters.js";
import { type DataModel } from "#core/dataModel/types.js";
import { introspectDatabase } from "./introspect/introspectDatabase.js";
import { introspectionToDataModel } from "./introspect/introspectionToDataModel.js";

export async function getDatamodel(_db: DrizzleDbClient): Promise<DataModel> {
  const introspection = await introspectDatabase(_db);
  const dataModel = introspectionToDataModel(introspection);
  return dataModel;
}
