export type JsonPrimitive = string | number | boolean | null

export type Json = JsonPrimitive | { [key: string]: Json } | Json[]

export type SerializablePrimitive =
  | string
  | number
  | boolean
  | null
  | Date
  | undefined

export type Serializable = SerializablePrimitive | Json