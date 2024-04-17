export type Fingerprint = Record<string, Record<string, FingerprintField>>;

export type FingerprintField =
  | FingerprintJsonField
  | FingerprintLLMField
  | FingerprintOptionsField
  | FingerprintPromptField
  | FingerprintRelationshipField;

export interface FingerprintJsonField {
  schema: Record<string, unknown>;
}

export interface FingerprintOptionsField {
  options: Record<string, unknown>;
}

interface FingerprintLLMField {
  description?: string;
}

interface FingerprintRelationshipField {
  count: { max: number; min: number } | number;
}

interface FingerprintPromptField {
  description?: string;
  examples?: Array<string>;
  itemCount?: number;
}
