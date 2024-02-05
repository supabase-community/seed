export type JsonPrimitive = boolean | null | number | string;

export type Json = { [key: string]: Json } | Array<Json> | JsonPrimitive;

export type SerializablePrimitive =
  | Date
  | boolean
  | null
  | number
  | string
  | undefined;

export type Serializable = Json | SerializablePrimitive;
