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
        authorization: `Bearer ${await getAccessToken()}`,
        "user-agent": `Snaplet Seed / ${getVersion()}`,
      }),
    }),
  ],
});

let accessToken: string | undefined;
async function getAccessToken() {
  return (
    process.env["SNAPLET_ACCESS_TOKEN"] ??
    (accessToken ??= (await getSystemConfig()).accessToken)
  );
}
