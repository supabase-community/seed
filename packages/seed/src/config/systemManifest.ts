import { readJson, writeJson } from "fs-extra";
import path from "node:path";
import { getSystemPath } from "./systemConfig.js";

const SYSTEM_MANIFEST_FILENAME = "system-manifest.json";

interface SystemManifest {
  lastEventTimestamps?: Record<string, number>;
}

const getSystemManifestPath = () => {
  const systemDir = getSystemPath();
  return path.resolve(systemDir, SYSTEM_MANIFEST_FILENAME);
};

export const saveSystemManifest = async (next: SystemManifest) => {
  await writeJson(getSystemManifestPath(), next);
};

export const updateSystemManifest = async (
  updates?: Partial<SystemManifest>,
) => {
  const current = await readSystemManifest();

  await saveSystemManifest({
    ...current,
    ...updates,
  });
};

export const readSystemManifest = async (): Promise<SystemManifest> => {
  try {
    return await readJson(getSystemManifestPath());
  } catch {
    // context(justinvdm, 10 Jan 2024): Any failed reads of the system manifest file should not
    // break `@snaplet/seed`
    return {};
  }
};
