import { mkdirp } from "fs-extra";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsonStringify } from "#core/utils.js";
import { getSystemPath } from "./systemConfig.js";

const SYSTEM_MANIFEST_FILENAME = "system-manifest.json";

interface SystemManifest {
  lastEventTimestamps?: Record<string, number>;
}

const getSystemManifestPath = () => {
  const systemDir = getSystemPath();
  return path.resolve(systemDir, SYSTEM_MANIFEST_FILENAME);
};

const saveSystemManifest = async (next: SystemManifest) => {
  await mkdirp(getSystemPath());
  await writeFile(getSystemManifestPath(), jsonStringify(next));
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
    return JSON.parse(
      (await readFile(getSystemManifestPath())).toString(),
    ) as SystemManifest;
  } catch {
    // context(justinvdm, 10 Jan 2024): Any failed reads of the system manifest file should not
    // break `@snaplet/seed`
    return {};
  }
};
