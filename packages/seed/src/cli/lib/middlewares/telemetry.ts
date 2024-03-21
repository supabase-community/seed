import { type Middleware } from "./types.js";

export const telemetryMiddleware: Middleware = (handler) => {
  return async (args) => {
    const { telemetry } = await import("../telemetry.js");
    await telemetry.captureEvent(`$command:${args._[0]}:start`);
    await handler(args);
    await telemetry.captureEvent(`$command:${args._[0]}:end`);
  };
};
