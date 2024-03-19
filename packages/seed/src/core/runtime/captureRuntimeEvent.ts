import {
  readSystemManifest,
  updateSystemManifest,
} from "#config/systemManifest.js";
import { createTelemetry } from "#core/telemetry/telemetry.js";

export const EVENT_THROTTLE_INTERVAL = 1000 * 60 * 60 * 24;

export const captureRuntimeEvent = async (
  event: string,
  properties: Record<string, unknown> = {},
) => {
  const now = Date.now();

  const manifest = await readSystemManifest();
  const lastEventTimestamps = (manifest.lastEventTimestamps ??= {});
  const lastEventTimestamp = lastEventTimestamps[event] ?? 0;

  if (now - lastEventTimestamp <= EVENT_THROTTLE_INTERVAL) {
    return;
  }

  lastEventTimestamps[event] = now;
  await updateSystemManifest({ lastEventTimestamps });

  const telemetry = createTelemetry({
    source: "seed",
  });

  await telemetry.captureEvent(event, properties);

  await telemetry.teardownTelemetry();
};
