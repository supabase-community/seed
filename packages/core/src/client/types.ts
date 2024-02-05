import { Constraints } from "../plan/types.js"
import { Store } from "../store/store.js"

export type ClientState = {
  constraints: Constraints
  store: Store
  seeds: Record<string, number>
  sequences: Record<string, Generator<number, never, unknown>>
}