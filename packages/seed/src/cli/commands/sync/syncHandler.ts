import { checkIsLoggedIn } from '#cli/lib/isLoggedIn.js';
import { dotSnapletPathExists, getDotSnapletPath } from "#config/dotSnaplet.js";
import { getProjectConfig, getProjectConfigPath, projectConfigExists } from "#config/project/projectConfig.js";
import { getSeedConfigPath, seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { SnapletError } from "#core/utils.js";
import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { predictHandler } from "../predict/predictHandler.js";

async function ensureCanSync() {
  if (!seedConfigExists()) {
    throw new SnapletError("SEED_CONFIG_NOT_FOUND", {
      path: await getSeedConfigPath(),
    });
  }

  if (!dotSnapletPathExists()) {
    throw new SnapletError("SNAPLET_FOLDER_NOT_FOUND", {
      path: await getDotSnapletPath(),
    });
  }

  if (!projectConfigExists()) {
    throw new SnapletError("SNAPLET_PROJECT_CONFIG_NOT_FOUND", {
      path: await getProjectConfigPath(),
    });
  }
}

export async function syncHandler(args: { isInit?: boolean; output?: string }) {
  await ensureCanSync();
  await introspectHandler();

  const isLoggedIn = await checkIsLoggedIn()
  const hasProjectId = Boolean((await getProjectConfig()).projectId)
  const canUseAI = (isLoggedIn && hasProjectId)

  if (!process.env["SNAPLET_DISABLE_AI"] || canUseAI) {
    await predictHandler({ isInit: args.isInit });
  }

  await generateHandler(args);
}
