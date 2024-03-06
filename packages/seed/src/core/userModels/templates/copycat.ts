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
  isString?: boolean;
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
  isString: boolean,
  extraOptions?: Partial<CopycatMethodOptions<MethodName>>,
): string => {
  const args = [...inputs.map((input) => String(input))];

  const { maxLength, optionsInput } = context;

  const options: Partial<CopycatMethodOptions<MethodName>> = {
    ...(extraOptions ?? {}),
  };

  let needsTruncating = false;

  if (maxLength != null) {
    if (COPYCAT_METHODS_SUPPORTING_LIMIT_SET.has(methodName)) {
      (options as { limit?: number }).limit = maxLength;
    } else {
      needsTruncating = true;
    }
  }

  const hasOwnOptions = Object.keys(options).length > 0;
  let optionsArg: null | string = null;

  if (optionsInput != null && hasOwnOptions) {
    optionsArg = `{ ...${JSON.stringify(options)}, ...${optionsInput} }`;
  } else if (optionsInput == null && hasOwnOptions) {
    optionsArg = JSON.stringify(options);
  } else if (optionsInput != null && !hasOwnOptions) {
    optionsArg = optionsInput;
  }

  if (optionsArg != null) {
    args.push(optionsArg);
  }

  let code = `copycat.${methodName}(${args.join(", ")})`;

  if (isString && COPYCAT_METHODS_RETURNING_NON_STRINGS_SET.has(methodName)) {
    code = `${code}.toString()`;
  }

  if (needsTruncating && isString) {
    code = `${code}.slice(0, ${context.maxLength})`;
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
      options?.isString ?? false,
      options?.options,
    );

  return templateFn;
};

export const copycatStringTemplate = <MethodName extends CopycatMethodName>(
  methodName: MethodName,
  options?: CopycatTemplateOptions<MethodName>,
): TemplateFn =>
  copycatTemplate(methodName, {
    isString: true,
    ...options,
  });
