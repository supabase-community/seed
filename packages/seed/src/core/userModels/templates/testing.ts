import { copycat } from "@snaplet/copycat";
import vm from "node:vm";
import { type TemplateContext } from "./types.js";

export const createTemplateContext = (): TemplateContext => ({
  field: {
    name: "field",
    type: "text",
  },
  shape: "EMAIL",
  jsType: "string",
  input: "input",
});

export const runTemplateCode = (context: TemplateContext, code: string) => {
  try {
    return {
      success: true,
      value: vm.runInNewContext(code, {
        copycat,
        Date,
        [String(context.input)]: "inputValue",
      }) as unknown,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
