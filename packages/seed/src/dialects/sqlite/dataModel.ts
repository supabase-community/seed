import { type DataModel } from "#core/dataModel/types.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { introspectDatabase } from "./introspect/introspectDatabase.js";
import { introspectionToDataModel } from "./introspect/introspectionToDataModel.js";

export async function getDatamodel(_db: DatabaseClient): Promise<DataModel> {
  const introspection = await introspectDatabase(_db);
  const dataModel = introspectionToDataModel(introspection);
  return dataModel;
}
