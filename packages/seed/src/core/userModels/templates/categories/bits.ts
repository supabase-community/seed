/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { type TypeTemplates } from "../types.js";

export const bits: TypeTemplates = ({ input, field }) => `
(() => {
  const len = ${field.maxLength} || 1
  let bits = ''
  for (let i = 0; i < len; i++) {
    bits += copycat.oneOf(${input} + i, ['0', '1'])
  }
  return bits
})()
`;
