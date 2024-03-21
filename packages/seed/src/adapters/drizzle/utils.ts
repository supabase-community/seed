import { type DrizzleDatabase } from "./types.js";

export function getSessionName(client: DrizzleDatabase) {
  // @ts-expect-error - Drizzle doesn't have a public API for getting the session name
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return client.session.constructor.name as string;
}
