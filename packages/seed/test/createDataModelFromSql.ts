import { type DataModel } from "#core/dataModel/types.js";
import { type Adapter } from "./adapters.js";

export const createDataModelFromSql = async (
  adapter: Adapter,
  sql: string,
): Promise<DataModel> => {
  const { client } = await adapter.createTestDb(sql);
  return adapter.dialect.getDataModel(client);
};
