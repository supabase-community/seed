import {
  type FingerprintField,
  type FingerprintOptionsField,
} from "./types.js";

export function isOptionsField(
  field: FingerprintField,
): field is FingerprintOptionsField {
  return "options" in field;
}
