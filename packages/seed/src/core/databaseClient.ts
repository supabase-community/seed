export type DatabaseClientDialect = "postgres" | "sqlite";
export abstract class DatabaseClient<T = unknown> {
  constructor(
    public dialect: DatabaseClientDialect,
    public client: T,
  ) {}
  abstract execute(query: string): Promise<void>;
  abstract query<K = unknown>(
    query: string,
    values?: Array<unknown>,
  ): Promise<Array<K>>;
}
