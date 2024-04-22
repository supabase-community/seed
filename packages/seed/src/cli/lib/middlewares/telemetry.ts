import { getUsageStatsFromConfig } from "#core/telemetry/getUsageStatsFromConfig.js";
import { type Middleware } from "./types.js";

export const telemetryMiddleware: Middleware = (handler) => {
  return async (args) => {
    const { telemetry } = await import("../telemetry.js");
    const commandName = args._[0];
    await telemetry.captureEvent(`$command:${commandName}:start`);
    await handler(args);
    await telemetry.captureEvent(`$command:${commandName}:end`);
  };
};

export const telemetryWithUsageStatsMiddleware: Middleware = (handler) => {
  return async (args) => {
    const { telemetry } = await import("../telemetry.js");
    const commandName = args._[0];
    await telemetry.captureEvent(`$command:${commandName}:start`);
    await handler(args);
    // We send the usage stats only on the :end events as it'll means the command has completed.
    // it'll avoid sending incomplete stats due to missconfiguration or errors.
    const usageStats = await getUsageStatsFromConfig();
    await telemetry.captureEvent(`$command:${commandName}:end`, {
      ...usageStats,
    });
  };
};
