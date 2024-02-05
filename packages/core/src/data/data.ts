import { mapValues } from "remeda";
import { isInstanceOf } from "../utils.js";
import { type Json, type Serializable } from "./types.js";

export const serializeValue = (value: Serializable): Json | undefined => {
  return isInstanceOf(value, Date) ? value.toISOString() : value;
};

export const serializeModelValues = (
  model: Record<string, Serializable>,
): Record<string, Json | undefined> => mapValues(model, serializeValue);
