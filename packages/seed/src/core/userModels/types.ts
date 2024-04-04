import { type Serializable } from "#core/data/types.js";
import { type ScalarField } from "../plan/types.js";
import { type Store } from "../store/store.js";

interface ConnectCallbackContext {
  $store: Store["_store"];
  index: number;
  seed: string;
  store: Store["_store"];
}

type ConnectCallback = (
  ctx: ConnectCallbackContext,
) => Record<string, Serializable>;

export type UserModelsData = Record<string, ScalarField>;

export type UserModels = Record<
  string,
  { connect?: ConnectCallback; data?: UserModelsData }
>;
