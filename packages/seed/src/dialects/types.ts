import { type ZodTuple } from "zod";
import { type DatabaseClient } from "#core/adapters.js";

export interface Driver {
  definitelyTyped?: string;
  getDatabaseClient(parameters: unknown): Promise<DatabaseClient>;
  id: string;
  package: string;
  parameters: ZodTuple;
}
