import { cliTelemetry } from "./cliTelemetry.js";

export const teardownCli = async () => {
  await cliTelemetry.teardownTelemetry();
};
