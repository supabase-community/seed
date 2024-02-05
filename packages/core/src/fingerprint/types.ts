export type Fingerprint = Record<string, Record<string, FingerprintField>>

export type FingerprintField =
  | FingerprintJsonField
  | FingerprintOptionsField
  | FingerprintRelationshipField

export type FingerprintJsonField = { schema: Record<string, unknown> }

export type FingerprintOptionsField = { options: Record<string, unknown> }

type FingerprintRelationshipField = {
  count: number | { min: number; max: number }
}