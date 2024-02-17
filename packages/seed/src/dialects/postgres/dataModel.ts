import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { type DataModel } from "#core/dataModel/types.js";
import { introspectDatabase } from "./introspect/introspectDatabase.js";
import { introspectionToDataModel } from "./introspect/introspectionToDataModel.js";

export async function getDatamodel<T extends QueryResultHKT>(
  _db: PgDatabase<T>,
): Promise<DataModel> {
  const introspection = await introspectDatabase(_db);
  const dataModel = introspectionToDataModel(introspection);
  return dataModel;
}
