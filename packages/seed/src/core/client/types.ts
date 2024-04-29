import { type DatabaseClient } from "#core/databaseClient.js";
import { type Constraints, type PlanOptions } from "../plan/types.js";
import { type Store } from "../store/store.js";
import { type UserModels } from "../userModels/types.js";

export interface SeedClientOptions {
  adapter?: DatabaseClient;
  connect?: PlanOptions["connect"];
  dryRun?: boolean;
  models?: UserModels;
}

export interface ClientState {
  constraints: Constraints;
  seeds: Record<string, number>;
  store: Store;
}
