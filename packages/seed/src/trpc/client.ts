import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { SNAPLET_API_URL } from "#config/constants.js";
import { getSystemConfig, updateSystemConfig } from "#config/systemConfig.js";
import { getVersion } from "#core/version.js";
import { type CLIRouter } from "./router.js";

type FetchEsque = NonNullable<Parameters<typeof httpLink>[0]["fetch"]>;
type FetchEsqueInput = URL | string;
type FetchEsqueInit = Parameters<FetchEsque>[1];

const httpFetch = globalThis.fetch;

const fetch: FetchEsque = async (
  input: FetchEsqueInput,
  rawInit: FetchEsqueInit,
) => {
  const systemConfig = await getSystemConfig();

  let init = undefined;

  // context(justinvdm, 15 Apr 2024): There's a minor differences between the typedefs for
  // trpc's `fetch` and native `fetch`
  if (rawInit != null) {
    init = {
      ...rawInit,
      signal: rawInit.signal ?? undefined,
    };
  }

  const result = await httpFetch(input, init);

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
