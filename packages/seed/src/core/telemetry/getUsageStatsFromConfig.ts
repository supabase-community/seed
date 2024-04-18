import { getProjectConfig } from "#config/project/projectConfig.js";
import {
  type SeedConfig,
  getSeedConfig,
} from "#config/seedConfig/seedConfig.js";

function extractFingerprintStats(fingerprint: SeedConfig["fingerprint"]) {
  let useFingerprint = false;
  let numberOfFingerprintedModels = 0;
  let numberOfFingerprintedFields = 0;
  let fingerprintOptionsStats = {
    fingerprintCount: 0,
    fingerprintOptions: 0,
    fingerprintSchema: 0,
    fingerprintDescription: 0,
    fingerprintExamples: 0,
    fingerprintItemsCount: 0,
  };
  if (fingerprint) {
    useFingerprint = true;
    numberOfFingerprintedModels = Object.keys(fingerprint).length;
    // Sum all the fields definition for each model in fingerprint
    numberOfFingerprintedFields = Object.values(fingerprint).reduce(
      (acc, cur) => {
        return acc + Object.keys(cur).length;
      },
      0,
    );
    // Count the number of times each fingerprint option is used
    fingerprintOptionsStats = Object.values(fingerprint).reduce((acc, cur) => {
      acc.fingerprintCount += Number(
        Object.values(cur).filter(
          (options) => typeof options === "object" && "count" in options,
        ).length,
      );
      acc.fingerprintOptions += Object.values(cur).filter(
        (options) => typeof options === "object" && "options" in options,
      ).length;
      acc.fingerprintSchema += Object.values(cur).filter(
        (options) => typeof options === "object" && "schema" in options,
      ).length;
      acc.fingerprintDescription += Object.values(cur).filter(
        (options) => typeof options === "object" && "description" in options,
      ).length;
      acc.fingerprintExamples += Object.values(cur).filter(
        (options) => typeof options === "object" && "examples" in options,
      ).length;
      acc.fingerprintItemsCount += Object.values(cur).filter(
        (options) => typeof options === "object" && "itemsCount" in options,
      ).length;
      return acc;
    }, fingerprintOptionsStats);
  }
  return {
    useFingerprint,
    numberOfFingerprintedModels,
    numberOfFingerprintedFields,
    ...fingerprintOptionsStats,
  };
}

function extractSelectStats(select: SeedConfig["select"]) {
  return {
    useSelect: select ? true : false,
    numberOfSelectClauses: select?.length ?? 0,
  };
}

function extractAliasStats(alias: SeedConfig["alias"]) {
  let useAlias = false;
  let numberOfAliasOverrides = 0;
  let useAliasInflection = false;
  let numberOfAliasInflectionOverrides = 0;
  if (alias) {
    useAlias = true;
    numberOfAliasOverrides = Object.keys(alias.override ?? {}).length;
    useAliasInflection = Boolean(alias.inflection);
    if (useAliasInflection && typeof alias.inflection === "object") {
      numberOfAliasInflectionOverrides = Object.keys(
        alias.inflection ?? {},
      ).length;
    }
  }
  return {
    useAlias,
    numberOfAliasOverrides,
    useAliasInflection,
    numberOfAliasInflectionOverrides,
  };
}

async function extractAdapterStats(adapter: SeedConfig["adapter"]) {
  let adapterName = undefined;
  let dialect = undefined;
  try {
    const adapterInstance = await adapter();
    adapterName = adapterInstance.constructor.name;
    dialect = adapterInstance.dialect;
  } catch (e) {
    // Ignore errors if the adapter is usable.
  }
  return {
    adapterName,
    dialect,
  };
}

export async function extractInsightFromSeedConfig(seedConfig: SeedConfig) {
  const selectStats = extractSelectStats(seedConfig.select);
  const aliasStats = extractAliasStats(seedConfig.alias);
  const fingerprintStats = extractFingerprintStats(seedConfig.fingerprint);
  const adapterStats = await extractAdapterStats(seedConfig.adapter);
  return {
    ...fingerprintStats,
    ...selectStats,
    ...aliasStats,
    ...adapterStats,
  };
}

export async function getProjectInfos() {
  try {
    const projectConfig = await getProjectConfig();
    return { ...projectConfig };
  } catch (e) {
    // Ignore errors if the project or seed config is not found.
  }
  return {};
}

export async function getUsageStatsFromConfig() {
  let insight = {};
  try {
    const seedConfig = await getSeedConfig();
    insight = await extractInsightFromSeedConfig(seedConfig);
  } catch (e) {
    // Ignore errors if the project or seed config is not found.
  }
  const projectInfos = await getProjectInfos();
  return {
    ...insight,
    ...projectInfos,
  };
}
