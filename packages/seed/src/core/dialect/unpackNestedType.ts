import { type NestedType } from "./types.js";

export const unpackNestedType = <Type extends string>(
  type: NestedType | Type,
): [Type, number] => {
  const [primitive, ...rest] = type.split("[]");
  return [primitive as Type, rest.length];
};
