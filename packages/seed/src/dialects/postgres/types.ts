export type DrizzleExecuteAdapterResults<T> =
  // node-postgres
  | { rows: T }
  // postgres-js
  | T;
