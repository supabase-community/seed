import { dedupePreferLast } from "../utils.js";
import { type UserModels, type UserModelsData } from "./types.js";

/**
 * Utility function to merge two user models, userModels2 will override userModels1 fields
 * It's used to:
 * - merge the static userModels computed from AI with the userModels provided in the client constructor as an option
 * - merge the userModels stored in the client with the userModels provided in a plan as an option
 */
export function mergeUserModels(
  userModels1: UserModels,
  userModels2: UserModels,
) {
  const mergedUserModels: UserModels = {};

  const userModels1Keys = Object.keys(userModels1);
  const userModels2Keys = Object.keys(userModels2);

  userModels1Keys.forEach((modelName) => {
    const userModel1 = userModels1[modelName] ?? {};
    const userModel2 = userModels2[modelName] ?? {};

    mergedUserModels[modelName] = {
      data: mergeUserModelsData(userModel1.data ?? {}, userModel2.data ?? {}),
      connect: userModel2.connect ?? userModel1.connect,
    };
  });

  userModels2Keys.forEach((modelName) => {
    if (!userModels1Keys.includes(modelName)) {
      mergedUserModels[modelName] = userModels2[modelName];
    }
  });

  return mergedUserModels;
}

const mergeUserModelsData = (
  data1: UserModelsData,
  data2: UserModelsData,
): UserModelsData => {
  const results: UserModelsData = {};

  const keys = dedupePreferLast([...Object.keys(data1), ...Object.keys(data2)]);

  for (const key of keys) {
    results[key] = Object.hasOwn(data2, key) ? data2[key] : data1[key];
  }

  return results;
};
