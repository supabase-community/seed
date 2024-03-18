import { runtimeTelemetry } from "./runtimeTelemetry.js";

export const teardownRuntime = async () => {
  await runtimeTelemetry.teardownTelemetry();
};
