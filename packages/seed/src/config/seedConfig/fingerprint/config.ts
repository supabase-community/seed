import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDotSnapletPath } from "../../dotSnaplet.js";
import { type FingerprintConfig, fingerprintConfigSchema } from "./schemas.js";

export async function getFingerprintConfig() {
  let fingerprintConfig: FingerprintConfig = {};

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const fingerprintConfigPath = join(dotSnapletPath, "fingerprint.json");
    if (existsSync(fingerprintConfigPath)) {
      fingerprintConfig = fingerprintConfigSchema.parse(
        JSON.parse(await readFile(fingerprintConfigPath, "utf8")),
      );
    }
  }

  return fingerprintConfig;
}
