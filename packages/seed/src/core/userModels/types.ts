import { type ScalarField, type Serializable } from "../plan/types.js";
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

export type JsTypeName =
  | "Buffer"
  | "Json"
  | "boolean"
  | "null"
  | "number"
  | "string";
