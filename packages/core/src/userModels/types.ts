import { ScalarField, Serializable } from '../plan/types.js'
import { Store } from '../store/store.js'

export type ConnectCallbackContext = {
  index: number
  seed: string
  store: Store['_store']
  $store: Store['_store']
}

export type ConnectCallback = (
  ctx: ConnectCallbackContext
) => Record<string, Serializable>


export type UserModelsData = Record<string, ScalarField>

export type UserModels = Record<
  string,
  { data?: UserModelsData; connect?: ConnectCallback }
>
