import { createTelemetry } from "#core/telemetry/telemetry.js";

export const cliTelemetry = createTelemetry({
  source: "seed-cli",
});
