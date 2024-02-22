import { copycatTemplate } from "../copycat.js";
import { type TypeTemplates } from "../types.js";

export const floats = (bytes: number): TypeTemplates => {
  return {
    LATITUDE: copycatTemplate("float", { options: { min: -90, max: 90 } }),
    LONGITUDE: copycatTemplate("float", { options: { min: -90, max: 90 } }),
    __DEFAULT: copycatTemplate("float", {
      options: { min: 0, max: Math.pow(2, bytes) },
    }),
  };
};
