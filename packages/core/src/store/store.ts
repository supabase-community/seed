import { type ModelData } from "../plan/types.js";

export interface Store {
  _store: Record<string, Array<ModelData>>;
  add(model: string, value: unknown): void;
  toSQL(): Array<string>;
}
