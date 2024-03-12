import { createServer } from "node:http";

export function getAccessTokenFromHttpServer(port: number) {
  return new Promise<string>((resolve) => {
    const server = createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, DELETE",
      );
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
    });

    server.on("request", (req, res) => {
      if (req.method === "POST" && req.url === "/cli-token") {
        let body = "";
        req.on("data", (chunk) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          body += chunk.toString();
        });
        req.on("end", () => {
          res.statusCode = 200;
          res.end("ok");
          const parsed = JSON.parse(body) as { password: string };
          server.close();
          resolve(parsed.password);
        });
      }
    });

    server.listen(port);
  });
}
