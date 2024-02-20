import type * as t from "@babel/types";
import { type JsTypeName } from "../types.js";
import { type ShapeExtra } from "./shapeExtra.js";
import { type Shape } from "./shapes.js";
import { type ShapeGenerate } from "./shapesGenerate.js";

export interface TemplateContext {
  field: { maxLength?: number; name: string; type: string };
  input: TemplateInputNode;
  jsType: JsTypeName;
  shape: Shape | ShapeGenerate | null;
}

export type TemplateInputNode = string | t.Expression | t.PatternLike;

export type TemplateResult = null | string;

export type TemplateFn = (api: TemplateContext) => TemplateResult;

export type TypeTemplates = TemplateFn | TypeTemplatesRecord;

export type TypeTemplatesRecord = Partial<
  Record<"__DEFAULT" | Shape | ShapeExtra | ShapeGenerate, TemplateFn | null>
>;

export type Templates<Type extends string = string> = Partial<
  Record<Type, TypeTemplates>
>;
