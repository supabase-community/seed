export abstract class DatabaseClient<T = unknown> {
  constructor(
    public dialect: "postgres" | "sqlite",
    public client: T,
  ) {}
  abstract disconnect(): Promise<void>;
  abstract execute(query: string): Promise<void>;
  abstract query<K = unknown>(
    query: string,
    values?: Array<unknown>,
  ): Promise<Array<K>>;
}
