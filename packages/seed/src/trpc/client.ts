import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { getSystemConfig } from "../config/systemConfig.js";
import { getVersion } from "../core/version.js";
import { type CLIRouter } from "./router.js";

let headers: Record<string, string> | undefined;

export const trpc = createTRPCProxyClient<CLIRouter>({
  links: [
    httpBatchLink({
      url:
        process.env["NODE_ENV"] === "production"
          ? "https://api.snaplet.dev/cli"
          : "http://localhost:8911",
      headers: async () => {
        return (headers ??= {
          authorization: `Bearer ${(await getSystemConfig()).accessToken}`,
          "user-agent": `Snaplet Seed / ${await getVersion()}`,
        });
      },
    }),
  ],
});
