import { type Shape } from "./shapes.js";
import {
  type TemplateContext,
  type TemplateFn,
  type TemplateInput,
  type Templates,
} from "./types.js";

export const generateCodeFromTemplate = <Type extends string>(
  input: TemplateInput,
  type: Type,
  maxLength: null | number,
  shape: Shape | null,
  templates: Templates<Type>,
) => {
  const context: TemplateContext = {
    input,
    type,
    maxLength,
    shape,
  };

  // todo(justinvdm, 28 Feb 2024): Bring back array support
  // https://linear.app/snaplet/issue/S-1901/bring-back-array-support-for-templates

  const shapeTemplates = templates[type];

  if (shapeTemplates == null) {
    return null;
  }

  if (typeof shapeTemplates === "function") {
    return shapeTemplates(context);
  }

  let fn: TemplateFn | null | undefined;

  if (shape == null || shapeTemplates[shape] == null) {
    fn = shapeTemplates.__DEFAULT ?? null;
  } else {
    fn = shapeTemplates[shape];
  }

  let templateResult: null | string = null;

  if (fn != null) {
    templateResult = fn(context);
  }

  return templateResult;
};
