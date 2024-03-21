import { asyncExitHook } from "exit-hook";
import { createTelemetry } from "#core/telemetry/telemetry.js";

export const telemetry = createTelemetry({
  source: "seed-cli",
});

asyncExitHook(() => telemetry.teardownTelemetry(), { wait: 2_000 });
