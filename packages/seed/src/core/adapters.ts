/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class DrizzleDbClient<T = any> {
  constructor(protected db: T) {}
  get adapter(): T {
    return this.db;
  }
  abstract query<K = any>(
    query: string,
    values?: Array<any>,
  ): Promise<Array<K>>;
  abstract run(query: string): Promise<void>;
}
