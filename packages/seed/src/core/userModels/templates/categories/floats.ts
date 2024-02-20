import { TypeTemplates } from '../types.js'

export const floats = (bytes: number): TypeTemplates => {
  return {
    LATITUDE: ({ input }) =>
      `copycat.float(${input}, { min: -90, max: 90 }).toString()`,
    LONGITUDE: ({ input }) =>
      `copycat.float(${input}, { min: -90, max: 90 }).toString()`,
    __DEFAULT: ({ input }) =>
      `copycat.float(${input}, { max: Math.pow(2, ${bytes}) })`,
  }
}
