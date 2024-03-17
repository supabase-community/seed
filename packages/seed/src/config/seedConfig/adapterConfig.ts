import * as z from "zod";
import { DatabaseClient } from "#core/databaseClient.js";

export const adapterConfigSchema = z
  .function()
  .returns(z.instanceof(DatabaseClient));

export type AdapterConfig = z.infer<typeof adapterConfigSchema>;
