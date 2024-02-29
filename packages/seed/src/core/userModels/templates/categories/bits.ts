import { type TypeTemplates } from "../types.js";

export const bits: TypeTemplates = ({ input, maxLength }) => `
(() => {
  const len = ${maxLength} || 1
  let bits = ''
  for (let i = 0; i < len; i++) {
    bits += copycat.oneOf(${input} + i, ['0', '1'])
  }
  return bits
})()
`;
