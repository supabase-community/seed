import ci from "ci-info";
import deepmerge from "deepmerge";
import os from "node:os";
import { PostHog } from "posthog-node";
import { v4 as uuidv4 } from "uuid";
import { IS_PRODUCTION } from "#config/constants.js";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { getSystemConfig, updateSystemConfig } from "#config/systemConfig.js";
import { getVersion } from "#core/version.js";

const POSTHOG_API_KEY = "phc_F2nspobfCOFDskuwSN7syqKyz8aAzRTw2MEsRvQSB5G";

type TelemetrySource = "seed" | "seed-cli";

interface TelemetryOptions {
  isProduction?: boolean;
  properties?: () => Promise<Record<string, unknown>> | Record<string, unknown>;
  source: TelemetrySource;
}

const createAnonymousId = async () => {
  const anonymousId = uuidv4();
  await updateSystemConfig({ anonymousId });
  return anonymousId;
};

// context(justinvdm, 30 Apr 2024): Determining distinct id (to identify distinct users):
// * If user logged in, use the user id as the distinct id
// * Otherwise if not CI, get/create anonymous id + use this as the distinct id
// * Otherwise if in CI and project id exists, use `<projectId>:ci` as the distinct id
// * Otherwise do not send metrics (e.g. if logged out CI user)
const getDistinctId = async () => {
  const systemConfig = await getSystemConfig();
  const projectConfig = await getProjectConfig();

  if (typeof systemConfig.userId === "string") {
    return systemConfig.userId;
  } else if (!ci.isCI) {
    return systemConfig.anonymousId ?? createAnonymousId();
  } else if (projectConfig.projectId != null) {
    return `${projectConfig.projectId}:ci`;
  } else {
    return null;
  }
};

export const createTelemetry = (options: TelemetryOptions) => {
  let posthog: PostHog | null = null;

  const {
    source,
    properties: baseProperties = () => ({}),
    isProduction = IS_PRODUCTION,
  } = options;

  const initPosthog = () =>
    (posthog ??= new PostHog(POSTHOG_API_KEY, {
      host: "https://app.posthog.com",
      flushAt: 0,
      flushInterval: 0,
    }));

  if (process.env["SNAPLET_DISABLE_TELEMETRY"] !== "1" && isProduction) {
    initPosthog();
  }

  const captureUserLogin = async (user: { email: string; id: string }) => {
    const { id: userId, email } = user;

    const distinctId = await getDistinctId();
    const { anonymousId } = await getSystemConfig();

    // Associate the old "anonymousId (alias)" to the new "userId (distinctId)"
    if (anonymousId != null && anonymousId === distinctId) {
      posthog?.alias({
        distinctId,
        alias: anonymousId,
      });
    }

    await updateSystemConfig({ userId });

    await captureEvent("$action:user:login", {
      $set: {
        userId,
        email,
      },
    });
  };

  const getIsAnonymous = async () => {
    const distinctId = await getDistinctId();
    const { anonymousId } = await getSystemConfig();
    return distinctId === anonymousId;
  };

  const captureEvent = async (
    event: string,
    properties: Record<string, unknown> = {},
  ) => {
    const distinctId = await getDistinctId();

    if (distinctId == null) {
      return;
    }

    const { userId } = await getSystemConfig();

    properties = {
      ...properties,
      source,
      version: `seed@${getVersion()}`,
      isAnonymous: await getIsAnonymous(),
      isCI: ci.isCI,
      ci: {
        isPR: ci.isPR,
        name: ci.name,
      },
      host: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
      },
      $set: { userId },
    };

    properties = deepmerge(baseProperties(), properties);
    posthog?.capture({
      distinctId,
      event,
      properties,
    });
  };

  const teardownTelemetry = async () => {
    await posthog?.shutdown();
  };

  const isEnabled = () => Boolean(posthog);

  return {
    isEnabled,
    captureEvent,
    captureUserLogin,
    teardownTelemetry,
  };
};
