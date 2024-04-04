import { mapValues } from "remeda";
import { isInstanceOf } from "../utils.js";
import { type Json, type Serializable } from "./types.js";

export const serializeValue = (value: Serializable): Json | undefined => {
  return typeof value === "bigint"
    ? value.toString()
    : isInstanceOf(value, Date)
      ? value.toISOString()
      : value;
};

export const serializeModelValues = (
  model: Record<string, Serializable>,
): Record<string, Json | undefined> => mapValues(model, serializeValue);
