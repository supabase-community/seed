import { type NestedType } from "#core/dialect/types.js";
import { unpackNestedType } from "#core/dialect/unpackNestedType.js";
import { type Shape } from "#trpc/shapes.js";
import {
  type TemplateContext,
  type TemplateFn,
  type TemplateInput,
  type Templates,
} from "./types.js";

function encloseValueInArray(value: string, dimensions: number) {
  if (dimensions === 0) {
    return value;
  }

  return Array(dimensions)
    .fill(undefined)
    .reduce<string>((acc) => `[${acc}]`, value);
}

export const generateCodeFromTemplate = <Type extends string>(props: {
  input: TemplateInput;
  maxLength: null | number;
  optionsInput: null | string;
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
    optionsInput,
  } = props;

  const [type, dimensions] = unpackNestedType<Type>(wrappedType);

  const context: TemplateContext<Type> = {
    input,
    type,
    maxLength,
    shape,
    optionsInput,
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
