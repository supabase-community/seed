import { type Constraints } from "../plan/types.js";
import { type Store } from "../store/store.js";

export interface ClientState {
  constraints: Constraints;
  seeds: Record<string, number>;
  sequences: Record<string, Generator<number, never>>;
  store: Store;
}
