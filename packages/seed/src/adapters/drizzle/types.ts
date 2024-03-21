import { type PgDatabase } from "drizzle-orm/pg-core";
import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleDatabase = BaseSQLiteDatabase<any, any> | PgDatabase<any>;
