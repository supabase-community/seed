import { type ZodTuple } from "zod";
import { type DatabaseClient } from "#core/databaseClient.js";

export interface Adapter {
  definitelyTyped?: string;
  getDatabaseClient(...parameters: Array<unknown>): Promise<DatabaseClient>;
  id: string;
  package: string;
  parameters: ZodTuple;
  template: {
    create: (parameters: Array<unknown>) => string;
    import: string;
  };
}
