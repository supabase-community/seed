import { getPortPromise as getPort } from "portfinder";
import prompt from "prompts";
import terminalLink from "terminal-link";
import { spinner } from "#cli/lib/spinner.js";
import { SNAPLET_APP_URL } from "#config/constants.js";
import { getSystemConfig, setSystemConfig } from "#config/systemConfig.js";
import { trpc } from "#trpc/client.js";
import { getAccessTokenFromHttpServer } from "./getAccessTokenFromHttpServer.js";

export async function loginHandler() {
  const systemConfig = await getSystemConfig();

  if (systemConfig.accessToken) {
    const user = await trpc.user.current.query();
    if (user) {
      const response = await prompt({
        type: "confirm",
        name: "continue",
        message: `You are already logged in as ${user.email}, do you want to continue?`,
        initial: false,
      });
      if (!response.continue) {
        return;
      }
    }
  }

  const port = await getPort();

  const accessTokenUrl = `${SNAPLET_APP_URL}/access-token/cli?port=${port}`;
  const link = terminalLink(accessTokenUrl, accessTokenUrl);

  console.log(`Please login by visiting ${link}`);

  spinner.start(`Waiting for login...`);

  const accessToken = await getAccessTokenFromHttpServer(port);

  // We must set the environment variable here so that the trpc client can use it as Bearer token
  process.env["SNAPLET_ACCESS_TOKEN"] = accessToken;
  const user = await trpc.user.current.query();

  if (!user) {
    spinner.fail("Failed to login");
    return;
  }

  const existingSystemConfig = await getSystemConfig({
    shouldOverrideWithEnv: false,
  });
  await setSystemConfig({ ...existingSystemConfig, accessToken });

  spinner.succeed(`Logged in as ${user.email}`);
}
