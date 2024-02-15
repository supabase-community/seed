import { type PgDatabase } from "drizzle-orm/pg-core";
import { type DataModel } from "#core/dataModel/types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDatamodel(_db: PgDatabase<any>): Promise<DataModel> {
  return Promise.resolve({ dialect: "postgres", enums: {}, models: {} });
}
