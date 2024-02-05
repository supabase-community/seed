import { execaCommand } from "execa";
import waitForLocalhost from "wait-for-localhost";

export async function setup() {
  const process = execaCommand("pnpm -F api dev", {
    shell: true,
  });

  await waitForLocalhost({ path: "/healthcheck", port: 1337, useGet: true });

  return () => {
    process.kill();
  };
}
