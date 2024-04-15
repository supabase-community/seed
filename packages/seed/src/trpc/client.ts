import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { SNAPLET_API_URL } from "#config/constants.js";
import { getSystemConfig, updateSystemConfig } from "#config/systemConfig.js";
import { getVersion } from "#core/version.js";
import { type CLIRouter } from "./router.js";

const httpFetch = globalThis.fetch;

const fetch: typeof httpFetch = async (url, init) => {
  const systemConfig = await getSystemConfig();

  const result = await httpFetch(url, init);

  const userId = result.headers.get("SNAPLET-USER-ID");

  if (
    typeof systemConfig.userId === "undefined" &&
    typeof userId === "string"
  ) {
    await updateSystemConfig({ userId });
  }

  return result;
};

export const trpc = createTRPCProxyClient<CLIRouter>({
  links: [
    httpLink({
      url: SNAPLET_API_URL,
      headers: async () => ({
        authorization: `Bearer ${await getAccessToken()}`,
        "user-agent": `Snaplet Seed / ${getVersion()}`,
      }),
      fetch,
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
