import { getProjectConfig } from "#config/project/projectConfig.js";
import { type AdapterId, adapters } from "./index.js";
import { type Adapter } from "./types.js";

export async function getAdapter(id?: AdapterId): Promise<Adapter> {
  if (id) {
    return adapters[id];
  }

  const projectConfig = await getProjectConfig();
  if (projectConfig?.adapter === undefined) {
    throw new Error(
      "Adapter not found, please ensure that the 'adapter' is set in `.snaplet/config.json`",
    );
  }

  return adapters[projectConfig.adapter];
}
