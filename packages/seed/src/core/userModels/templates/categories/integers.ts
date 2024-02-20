import { type TypeTemplates } from "../types.js";

export const integers = (bytes: number): TypeTemplates => {
  return {
    INDEX: ({ input }) =>
      `copycat.int(${input}, { min: 1, max: Math.pow(${bytes}, 8) - 1 }).toString()`,
    LATITUDE: ({ input }) =>
      `copycat.int(${input}, { min: -90, max: 90 }).toString()`,
    LONGITUDE: ({ input }) =>
      `copycat.int(${input}, { min: -90, max: 90 }).toString()`,
    __DEFAULT: ({ input }) =>
      `copycat.int(${input}, { min: 0, max: Math.pow(${bytes}, 8) - 1 })`,
  };
};
