export type Fingerprint = Record<string, Record<string, FingerprintField>>;

export type FingerprintField =
  | FingerprintJsonField
  | FingerprintLLMField
  | FingerprintOptionsField
  | FingerprintRelationshipField;

export interface FingerprintJsonField {
  schema: Record<string, unknown>;
}

export interface FingerprintOptionsField {
  options: Record<string, unknown>;
}

interface FingerprintLLMField {
  prompt?: { description?: string };
}

interface FingerprintRelationshipField {
  count: { max: number; min: number } | number;
}
