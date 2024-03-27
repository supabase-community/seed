import { type DialectId } from "#dialects/dialects.js";

export type DialectRecordWithDefault = Partial<Record<DialectId, string>> &
  Record<"default", string>;
