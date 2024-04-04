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
