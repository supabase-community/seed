import { type Json, type Serializable } from "../../core/data/types.js";
import { type Store } from "../store/store.js";
import { type UserModels } from "../userModels/types.js";

export type Constraints = Record<string, Record<string, Set<string>>>;

export interface GenerateOptions {
  models?: UserModels;
  seed?: string;
}

export interface IPlan extends PromiseLike<unknown> {
  generate(options?: GenerateOptions): Promise<Store>;
  options?: PlanOptions;

  run(): Promise<unknown>;

  store: Store;
}

export type ScalarField = GenerateCallback | Serializable;

type ChildModelCallback = (
  ctx: ModelCallbackContext & {
    index: number;
  },
) => ModelRecord;

export type ChildModel = ChildModelCallback | ModelRecord;

export type CountCallback = (
  x: { max: number; min: number } | number,
  cb?: ChildModel,
) => Array<ChildModel>;

export type ChildField =
  | ((cb: CountCallback) => Array<ChildModel>)
  | Array<ChildModel>;

interface ConnectCallbackContext {
  $store: Store["_store"];
  index: number;
  seed: string;
  store: Store["_store"];
}

export type ConnectCallback = ((
  ctx: ConnectCallbackContext,
) => Record<string, Serializable>) & { fallback?: boolean };

export class ConnectInstruction {
  constructor(public callback: ConnectCallback) {}
}

interface ModelCallbackContext {
  $store: Store["_store"];
  data: Record<string, Json>;
  seed: string;
  store: Store["_store"];
}

type ParentModelCallback = (
  ctx: ModelCallbackContext & {
    connect: (cb: ConnectCallback) => ConnectInstruction;
  },
) => ConnectInstruction | ModelRecord;

export type ParentField = ModelRecord | ParentModelCallback;

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ModelRecord {
  [key: string]: ChildField | ParentField | ScalarField;
}

export interface PlanInputs {
  inputs: ChildField;
  model: string;
}

export interface GenerateCallbackContext {
  $store: Store["_store"];
  data: Record<string, unknown>;
  index: number;
  options: Record<string, unknown>;
  seed: string;
  store: Store["_store"];
}

export type GenerateCallback = (
  ctx: GenerateCallbackContext,
) => Promise<Serializable> | Serializable;

export type ModelData = Record<string, Serializable | undefined>;

export interface PlanOptions {
  connect?: Record<string, Array<Record<string, Json>>> | true;
  models?: UserModels;
  seed?: string;
}
