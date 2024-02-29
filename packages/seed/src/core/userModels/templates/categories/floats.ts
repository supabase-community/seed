import { copycatTemplate } from "../copycat.js";
import { type TypeTemplates } from "../types.js";

export const floats = (bytes: number): TypeTemplates => {
  return {
    LOCATION_LATITUDE: copycatTemplate("int", {
      options: { min: -90, max: 90 },
    }),
    LOCATION_LONGITUDE: copycatTemplate("int", {
      options: { min: -90, max: 90 },
    }),
    __DEFAULT: copycatTemplate("float", {
      options: { min: 0, max: Math.pow(2, bytes) },
    }),
  };
};
