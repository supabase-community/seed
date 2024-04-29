export type DatabaseClientDialect = "mysql" | "postgres" | "sqlite";
export abstract class DatabaseClient<T = unknown> {
  constructor(public client: T) {}
  abstract execute(query: string): Promise<void>;
  abstract query<K = unknown>(
    query: string,
    values?: Array<unknown>,
  ): Promise<Array<K>>;
}
