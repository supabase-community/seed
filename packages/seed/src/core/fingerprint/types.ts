export type Fingerprint = Record<string, Record<string, FingerprintField>>;

export type FingerprintField =
  | FingerprintJsonField
  | FingerprintOptionsField
  | FingerprintPromptField
  | FingerprintRelationshipField;

export interface FingerprintJsonField {
  schema: Record<string, unknown>;
}

export interface FingerprintOptionsField {
  options: Record<string, unknown>;
}

interface FingerprintRelationshipField {
  count: { max: number; min: number } | number;
}

interface FingerprintPromptField {
  prompt:
    | {
        description: string;
        examples?: Array<string>;
        itemCount?: number;
      }
    | string;
}
