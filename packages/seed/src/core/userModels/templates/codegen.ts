import { type Shape } from "#trpc/shapes.js";
import {
  type TemplateContext,
  type TemplateFn,
  type TemplateInput,
  type Templates,
} from "./types.js";

type NestedType = string;

export const unpackNestedType = <Type extends string>(
  type: NestedType | Type,
): [Type, number] => {
  const [primitive, ...rest] = type.split("[]");
  return [primitive as Type, rest.length];
};

function encloseValueInArray(value: string, dimensions: number) {
  if (dimensions === 0) {
    return value;
  }

  return Array(dimensions)
    .fill(undefined)
    .reduce<string>((acc) => `[${acc}]`, value);
}

export const generateCodeFromTemplate = <
  Type extends string,
  Extras extends Record<string, unknown>,
>(props: {
  extras?: Extras;
  input: TemplateInput;
  maxLength: null | number;
  shape: Shape | null;
  templates: Templates;
  type: NestedType | Type;
}) => {
  const {
    input,
    maxLength,
    shape,
    templates,
    type: wrappedType,
    extras,
  } = props;

  const [type, dimensions] = unpackNestedType<Type>(wrappedType);

  const context: TemplateContext<Type, Extras> = {
    input,
    type,
    maxLength,
    shape,
    extras,
  };

  let result: null | string = null;
  const shapeTemplates = templates[type];

  if (shapeTemplates == null) {
    result = null;
  } else if (typeof shapeTemplates === "function") {
    result = shapeTemplates(context);
  } else {
    let fn: TemplateFn | null | undefined;

    if (shape == null || shapeTemplates[shape] == null) {
      fn = shapeTemplates.__DEFAULT ?? null;
    } else {
      fn = shapeTemplates[shape];
    }

    if (fn != null) {
      result = fn(context);
    }
  }

  return result != null ? encloseValueInArray(result, dimensions) : null;
};
