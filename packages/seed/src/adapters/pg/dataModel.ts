import { type Client } from "pg";
import { type DataModel } from "#core/dataModel/types.js";

export async function getDatamodel(_client: Client): Promise<DataModel> {
  return Promise.resolve({ enums: {}, models: {} });
}
