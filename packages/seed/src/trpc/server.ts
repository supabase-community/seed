import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { cliRouter } from "./router.js";

const server = createHTTPServer({
  router: cliRouter,
});

server.listen(3000);

server.server.on("listening", () => {
  console.log("Listening on http://localhost:3000");
});
