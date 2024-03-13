import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { SNAPLET_API_URL } from "#config/constants.js";
import { getSystemConfig } from "#config/systemConfig.js";
import { getVersion } from "#core/version.js";
import { type CLIRouter } from "./router.js";

export const trpc = createTRPCProxyClient<CLIRouter>({
  links: [
    httpLink({
      url: SNAPLET_API_URL,
      headers: async () => ({
        authorization: `Bearer ${process.env["SNAPLET_ACCESS_TOKEN"] ?? (await getSystemConfig()).accessToken}`,
        "user-agent": `Snaplet Seed / ${await getVersion()}`,
      }),
    }),
  ],
});
