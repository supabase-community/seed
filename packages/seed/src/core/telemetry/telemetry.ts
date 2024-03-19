import ci from "ci-info";
import deepmerge from "deepmerge";
import os from "node:os";
import { PostHog } from "posthog-node";
import { v4 as uuidv4 } from "uuid";
import { getSystemConfig, updateSystemConfig } from "#config/systemConfig.js";

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

const getDistinctId = async () => {
  const systemConfig = await getSystemConfig();

  if (typeof systemConfig.userId === "string") {
    return systemConfig.userId;
  } else if (typeof systemConfig.anonymousId == "string") {
    return systemConfig.anonymousId;
  } else {
    return createAnonymousId();
  }
};

export const createTelemetry = (options: TelemetryOptions) => {
  let posthog: PostHog | null = null;

  const {
    source,
    properties: baseProperties = () => ({}),
    isProduction = process.env["NODE_ENV"] === "production",
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

  const captureUserLogin = async (userId: string) => {
    // Cache the userId in the system configuration.
    await updateSystemConfig({ userId });

    const distinctId = await getDistinctId();
    const { anonymousId } = await getSystemConfig();

    // Associate the old "anonymousId (alias)" to the new "userId (distinctId)"
    if (anonymousId != null) {
      posthog?.alias({
        distinctId,
        alias: anonymousId,
      });
    }

    await captureEvent("$actions:user:login");
  };

  const captureEvent = async (
    event: string,
    properties: Record<string, unknown> = {},
  ) => {
    const { userId } = await getSystemConfig();

    properties = {
      ...properties,
      source,
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
      distinctId: await getDistinctId(),
      event,
      properties,
    });
  };

  const teardownTelemetry = async () => {
    await posthog?.shutdown();
  };

  return {
    captureEvent,
    captureUserLogin,
    teardownTelemetry,
  };
};