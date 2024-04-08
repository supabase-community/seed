import { getPortPromise as getPort } from "portfinder";
import { SNAPLET_APP_URL } from "#config/constants.js";
import { updateSystemConfig } from "#config/systemConfig.js";
import { trpc } from "#trpc/client.js";
import { eraseLines, highlight, link, spinner } from "../../lib/output.js";
import { telemetry } from "../../lib/telemetry.js";
import { getAccessTokenFromHttpServer } from "./getAccessTokenFromHttpServer.js";

export async function loginHandler(args?: { accessToken?: string }) {
  let accessToken = args?.accessToken;
  let prompted = false;

  if (!accessToken) {
    const port = await getPort();

    const accessTokenUrl = `${SNAPLET_APP_URL}/access-token/cli-auto?port=${port}`;

    console.log(`Please visit the following URL in your web browser:`);
    console.log(link(accessTokenUrl));
    spinner.start(`Waiting for authentication to be completed`);

    accessToken = await getAccessTokenFromHttpServer(port);
    prompted = true;
  }

  // We must set the environment variable here so that the trpc client can use it as Bearer token
  process.env["SNAPLET_ACCESS_TOKEN"] = accessToken;
  const user = await trpc.user.current.query();

  if (!user) {
    spinner.fail("Failed to login");
    return;
  }

  await updateSystemConfig({
    accessToken,
  });

  await telemetry.captureUserLogin(user);

  spinner.stop();
  if (prompted) {
    eraseLines(3);
  }
  spinner.succeed(`Logged in as ${highlight(user.email)}`);
}
