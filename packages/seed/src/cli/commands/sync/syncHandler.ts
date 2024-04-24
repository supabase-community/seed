import { getDotSnapletPath } from "#config/dotSnaplet.js";
import { getProjectConfigPath } from "#config/project/paths.js";
import { getSeedConfigPath } from "#config/seedConfig/seedConfig.js";
import { SnapletError } from "#core/utils.js";
import { generateHandler } from "../generate/generateHandler.js";
import { loggedCommandPrerun } from "../init/initHandler.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { predictHandler } from "../predict/predictHandler.js";

async function ensureCanSync() {
  const {
    isFirstTimeInit,
    projectConfigExist,
    seedConfigExist,
    dotSnapletExist,
  } = await loggedCommandPrerun();
  if (isFirstTimeInit) {
    if (!seedConfigExist) {
      throw new SnapletError("SEED_CONFIG_NOT_FOUND", {
        path: await getSeedConfigPath(),
      });
    }
    if (!dotSnapletExist) {
      throw new SnapletError("SNAPLET_FOLDER_NOT_FOUND", {
        path: await getDotSnapletPath(),
      });
    }
    if (!projectConfigExist) {
      throw new SnapletError("SNAPLET_PROJECT_CONFIG_NOT_FOUND", {
        path: await getProjectConfigPath(),
      });
    }
  }
}

export async function syncHandler(args: { isInit?: boolean; output?: string }) {
  await ensureCanSync();
  await introspectHandler();

  if (!process.env["SNAPLET_DISABLE_SHAPE_PREDICTION"]) {
    await predictHandler({ isInit: args.isInit });
  }

  await generateHandler(args);
}
