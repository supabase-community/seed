import { type DataModel } from "./dataModel/types.js";
import { type UserModels } from "./userModels/types.js";

export type DatabaseClientDialect = "postgres" | "sqlite";
export abstract class DatabaseClient<T = unknown> {
  constructor(
    public dialect: DatabaseClientDialect,
    public client: T,
  ) {}
  adapterPatchUserModels(props: {
    dataModel: DataModel;
    userModels: UserModels;
  }): UserModels {
    return props.userModels;
  }
  abstract execute(query: string): Promise<void>;
  abstract query<K = unknown>(
    query: string,
    values?: Array<unknown>,
  ): Promise<Array<K>>;
}
