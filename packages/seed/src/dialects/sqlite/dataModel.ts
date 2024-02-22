import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { type DataModel } from "#core/dataModel/types.js";
import { introspectDatabase } from "./introspect/introspectDatabase.js";
import { introspectionToDataModel } from "./introspect/introspectionToDataModel.js";

export async function getDatamodel<T extends "async" | "sync", R>(
  _db: BaseSQLiteDatabase<T, R>,
): Promise<DataModel> {
  const introspection = await introspectDatabase(_db);
  const dataModel = introspectionToDataModel(introspection);
  return dataModel;
}
