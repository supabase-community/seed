import { isInstanceOf } from '../utils.js'
import { Serializable, Json } from './types.js'
import { mapValues } from 'remeda'

export const serializeValue = (value: Serializable): Json | undefined => {
  return isInstanceOf(value, Date) ? value.toISOString() : value
}

export const serializeModelValues = (model: {
  [field: string]: Serializable
}): {
  [field: string]: Json | undefined
} => mapValues(model, serializeValue)
