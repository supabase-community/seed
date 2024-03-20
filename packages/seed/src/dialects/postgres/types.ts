export type DrizzleExecuteAdapterResults<T> =
  // pg
  | { rows: T }
  // postgres
  | T;
