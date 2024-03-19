import { getPortPromise as getPort } from "portfinder";
import { SNAPLET_APP_URL } from "#config/constants.js";
import { updateSystemConfig } from "#config/systemConfig.js";
import { trpc } from "#trpc/client.js";
import { eraseLines, highlight, link, spinner } from "../../lib/output.js";
import { getAccessTokenFromHttpServer } from "./getAccessTokenFromHttpServer.js";

export async function loginHandler() {
  const port = await getPort();

  const accessTokenUrl = `${SNAPLET_APP_URL}/access-token/cli?port=${port}`;

  console.log(`Please visit the following URL in your web browser:`);
  console.log(link(accessTokenUrl));
  spinner.start(`Waiting for authentication to be completed`);

  const accessToken = await getAccessTokenFromHttpServer(port);

  // We must set the environment variable here so that the trpc client can use it as Bearer token
  process.env["SNAPLET_ACCESS_TOKEN"] = accessToken;
  const user = await trpc.user.current.query();

  if (!user) {
    spinner.fail("Failed to login");
    return;
  }

  await updateSystemConfig({ accessToken });

  spinner.stop();
  eraseLines(3);
  spinner.succeed(`Logged in as ${highlight(user.email)}`);
}
