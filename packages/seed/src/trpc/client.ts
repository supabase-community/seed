import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type CLIRouter } from "./router.js";

export const trpc = createTRPCProxyClient<CLIRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000",
    }),
  ],
});
