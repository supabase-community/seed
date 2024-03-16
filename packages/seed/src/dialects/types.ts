import { type ZodTuple } from "zod";
import { type DatabaseClient } from "#core/databaseClient.js";

export interface Driver {
  definitelyTyped?: string;
  getDatabaseClient(parameters: unknown): Promise<DatabaseClient>;
  id: string;
  package: string;
  parameters: ZodTuple;
  template: {
    create: (parameters: Array<unknown>) => string;
    import: string;
  };
}
