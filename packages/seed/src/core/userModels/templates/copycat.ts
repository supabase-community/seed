import { type copycat } from "@snaplet/copycat";
import { type Json } from "#core/data/types.js";
import { type TemplateContext, type TemplateFn } from "./types.js";

type Copycat = typeof copycat;

type CopycatMethodName = keyof Copycat;

type CopycatMethodOptions<MethodName extends CopycatMethodName> = Last<
  Parameters<Copycat[MethodName]>
>;

type Last<Items extends Array<unknown>> = Items extends [
  ...infer _Rest,
  infer Item,
]
  ? Item
  : Items extends [...infer _Rest, (infer Item)?]
    ? Item
    : never;

interface CopycatTemplateOptions<MethodName extends CopycatMethodName> {
  args?: Array<Json>;
  options?: Partial<CopycatMethodOptions<MethodName>>;
}

const COPYCAT_METHODS_SUPPORTING_LIMIT_SET = new Set<CopycatMethodName>([
  "email",
  "username",
  "firstName",
  "lastName",
  "fullName",
  "oneOfString",
  "url",
]);

const COPYCAT_METHODS_RETURNING_NON_STRINGS_SET = new Set<CopycatMethodName>([
  "bool",
  "float",
  "int",
  "oneOf",
]);

export const generateCopycatCall = <MethodName extends CopycatMethodName>(
  context: TemplateContext,
  methodName: MethodName,
  inputs: Array<string>,
  extraOptions?: Partial<CopycatMethodOptions<MethodName>>,
): string => {
  const args = [...inputs.map((input) => String(input))];
  const options = { ...(extraOptions ?? {}) };

  let needsTruncating = false;

  if (context.field.maxLength != null) {
    if (COPYCAT_METHODS_SUPPORTING_LIMIT_SET.has(methodName)) {
      (options as { limit?: number }).limit = context.field.maxLength;
    } else {
      needsTruncating = true;
    }
  }

  if (Object.keys(options).length > 0) {
    args.push(JSON.stringify(options));
  }

  let code = `copycat.${methodName}(${args.join(", ")})`;

  if (
    context.jsType === "string" &&
    COPYCAT_METHODS_RETURNING_NON_STRINGS_SET.has(methodName)
  ) {
    code = `${code}.toString()`;
  }

  if (needsTruncating && context.jsType === "string") {
    code = `${code}.slice(0, ${context.field.maxLength})`;
  }

  return code;
};

export const copycatTemplate = <MethodName extends CopycatMethodName>(
  methodName: MethodName,
  options?: CopycatTemplateOptions<MethodName>,
): TemplateFn => {
  const serializedArgs = (options?.args ?? []).map((arg) =>
    JSON.stringify(arg),
  );

  const templateFn: TemplateFn = (context) =>
    generateCopycatCall(
      context,
      methodName,
      [context.input, ...serializedArgs],
      options?.options,
    );

  return templateFn;
};
