import { type DataModel } from "../dataModel/types.js";
import { type ModelData } from "../plan/types.js";

export interface Store {
  _store: Record<string, Array<ModelData>>;
  add(model: string, value: ModelData): void;
  toSQL(): Array<string>;
}

export abstract class StoreBase implements Store {
  _store: Record<string, Array<ModelData>>;
  public readonly dataModel: DataModel;

  constructor(dataModel: DataModel) {
    this.dataModel = dataModel;
    this._store = Object.fromEntries(
      Object.keys(dataModel.models).map((modelName) => [modelName, []]),
    );
  }

  add(model: string, value: ModelData) {
    this._store[model].push(value);
  }

  abstract toSQL(): Array<string>;
}
