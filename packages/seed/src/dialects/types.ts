import { type ZodTuple } from "zod";
import { type DatabaseClient } from "#core/adapters.js";

export interface DriverItem {
  definitelyTyped?: string;
  getDatabaseClient(parameters: unknown): Promise<DatabaseClient>;
  name: string;
  package: string;
  parameters: ZodTuple;
}

export type Dialect = "postgres" | "sqlite";
