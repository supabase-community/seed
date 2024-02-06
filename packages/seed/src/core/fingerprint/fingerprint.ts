import { getFingerprintConfig, getSnapletConfig } from "@snaplet/config";
import { mergeDeep } from "remeda";
import {
  type FingerprintField,
  type FingerprintOptionsField,
} from "./types.js";

export function isOptionsField(
  field: FingerprintField,
): field is FingerprintOptionsField {
  return "options" in field;
}

export async function getFingerprint() {
  const snapletConfig = await getSnapletConfig();
  const fingerprintConfig = await getFingerprintConfig();

  return mergeDeep(fingerprintConfig, snapletConfig.seed?.fingerprint ?? {});
}
