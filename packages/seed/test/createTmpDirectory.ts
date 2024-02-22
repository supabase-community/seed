import { type DirectoryResult, dir } from "tmp-promise";

interface State {
  tmpPaths: Array<{
    dir: DirectoryResult;
    keep: boolean;
    name: string;
  }>;
}

const defineCreateTestTmpDirectory = (state: State) => {
  const createTestTmpDirectory = async (
    keep = false,
  ): Promise<State["tmpPaths"][number]> => {
    const x = await dir({ tries: 10 });
    const path = { keep, name: x.path, dir: x };
    state.tmpPaths.push(path);
    return path;
  };

  createTestTmpDirectory.afterAll = async () => {
    const tmpPaths = state.tmpPaths;
    state.tmpPaths = [];

    const cleanupFunctions = tmpPaths
      .filter((x) => !x.keep)
      .map((x) => x.dir.cleanup);
    try {
      await Promise.allSettled(cleanupFunctions);
    } catch (e) {
      console.error(e);
    }
  };

  return createTestTmpDirectory;
};

export const createTestTmpDirectory = defineCreateTestTmpDirectory({
  tmpPaths: [],
});
