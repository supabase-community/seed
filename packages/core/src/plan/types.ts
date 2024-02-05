import { Store } from '../store/store.js'
import { UserModels } from '../userModels/types.js'
import { PlanOptions } from './plan.js'

export type Constraints = Record<string, Record<string, Set<string>>>

export type GenerateOptions = {
  seed?: string
  models?: UserModels
}

export type PlanGenerateContext = {
  index: number
  sequences?: Record<string, Generator<number, never, unknown>>
}
export interface IPlan extends PromiseLike<any> {
  store: Store
  options?: PlanOptions

  generate(options?: GenerateOptions): Promise<Store>

  run(): Promise<any>
}

export type JsonPrimitive = string | number | boolean | null

type Json = JsonPrimitive | { [key: string]: Json } | Json[]

export type SerializablePrimitive =
  | string
  | number
  | boolean
  | null
  | Date
  | undefined

export type Serializable = SerializablePrimitive | Json

export type ScalarField = GenerateCallback | Serializable

type ChildModelCallback = (
  ctx: ModelCallbackContext & {
    index: number
  }
) => ModelRecord

export type ChildModel = ModelRecord | ChildModelCallback

export type CountCallback = (
  x: number | { min: number; max: number },
  cb?: ChildModel
) => Array<ChildModel>

export type ChildField =
  | ((cb: CountCallback) => Array<ChildModel>)
  | Array<ChildModel>

export type ConnectCallbackContext = {
  index: number
  seed: string
  store: Store['_store']
  $store: Store['_store']
}

export type ConnectCallback = (
  ctx: ConnectCallbackContext
) => Record<string, Serializable>

export class ConnectInstruction {
  constructor(public callback: ConnectCallback) { }
}

type ModelCallbackContext = {
  seed: string
  store: Store['_store']
  $store: Store['_store']
  data: Record<string, Json>
}

type ParentModelCallback = (
  ctx: ModelCallbackContext & {
    connect: (cb: ConnectCallback) => ConnectInstruction
  }
) => ConnectInstruction | ModelRecord

export type ParentField = ModelRecord | ParentModelCallback

export interface ModelRecord {
  [key: string]: ScalarField | ParentField | ChildField
}

export type PlanInputs = {
  model: string
  inputs: ChildField
}

export type GenerateCallbackContext = {
  options: Record<string, unknown>
  data: Record<string, unknown>
  index: number
  seed: string
  store: Store['_store']
  $store: Store['_store']
}

export type GenerateCallback = (
  ctx: GenerateCallbackContext
) => Serializable | Promise<Serializable>
