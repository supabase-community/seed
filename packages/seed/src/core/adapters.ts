export abstract class DatabaseClient<T = unknown> {
  constructor(
    protected dialect: "mysql" | "postgres" | "sqlite",
    protected client: T,
  ) {}
  abstract disconnect(): Promise<void>;
  abstract query<K = unknown>(
    query: string,
    values?: Array<unknown>,
  ): Promise<Array<K>>;
  abstract run(query: string): Promise<void>;
}
