import { asyncExitHook } from "exit-hook";
import { createTelemetry } from "#core/telemetry/telemetry.js";

export const cliTelemetry = createTelemetry({
  source: "seed-cli",
});

asyncExitHook(() => cliTelemetry.teardownTelemetry(), { wait: 2_000 });
