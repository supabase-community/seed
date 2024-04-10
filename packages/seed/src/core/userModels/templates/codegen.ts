import { type NestedType } from "#core/dialect/types.js";
import { unpackNestedType } from "#core/dialect/unpackNestedType.js";
import { type Shape } from "#trpc/shapes.js";
import { encloseValueInArray } from "../encloseValueInArray.js";
import {
  type TemplateContext,
  type TemplateFn,
  type TemplateInput,
  type Templates,
} from "./types.js";

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
  if (!shapeTemplates) {
    result = null;
  } else if (typeof shapeTemplates === "function") {
    result = shapeTemplates(context);
  } else {
    let fn: TemplateFn | null | undefined;

    if (!shape || !shapeTemplates[shape]) {
      fn = shapeTemplates.__DEFAULT ?? null;
    } else {
      fn = shapeTemplates[shape];
    }

    if (fn) {
      result = fn(context);
    }
  }

  return result ? encloseValueInArray(result, dimensions) : null;
};
