import { copycatTemplate } from "../copycat.js";
import { type TypeTemplates } from "../types.js";

export const integers = (bytes: number): TypeTemplates => {
  return {
    INDEX: copycatTemplate("int", {
      options: { min: 1, max: Math.pow(bytes, 8) - 1 },
    }),
    LATITUDE: copycatTemplate("int", { options: { min: -90, max: 90 } }),
    LONGITUDE: copycatTemplate("int", { options: { min: -90, max: 90 } }),
    __DEFAULT: copycatTemplate("int", {
      options: { min: 0, max: Math.pow(bytes, 8) - 1 },
    }),
  };
};
