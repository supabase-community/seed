import { FingerprintField, FingerprintOptionsField } from "./types.js";

export function isOptionsField(
  field: FingerprintField
): field is FingerprintOptionsField {
  return 'options' in field
}