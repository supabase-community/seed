/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { type TypeTemplatesRecord } from "../types.js";

export const AUTO_TRANSFORM_STRING_TEMPLATES: TypeTemplatesRecord = {
  UUID: ({ input }) => `copycat.scramble(${input}, { preserve: ['-'] })`,
  INDEX: ({ input }) => `copycat.scramble(${input}, { preserve: [] })`,
  TOKEN: ({ input }) => `copycat.scramble(${input}, { preserve: [] })`,
  NUMBER: ({ input }) => `copycat.scramble(${input}, { preserve: [] })`,
  EMAIL: ({ input }) => `copycat.scramble(${input}, { preserve: ['@', '.']})`,
  USERNAME: ({ input }) => `copycat.scramble(${input})`,
  ZIP_CODE: ({ input }) =>
    `copycat.scramble(${input}, { preserve: ['#', '-'] })`,
  PASSWORD: ({ input }) => `copycat.scramble(${input}, { preserve: [] })`,
  __DEFAULT: ({ input }) => `copycat.scramble(${input})`,
};
