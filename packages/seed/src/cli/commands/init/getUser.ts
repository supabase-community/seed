import { trpc } from "#trpc/client.js";

export async function getUser() {
  try {
    return await trpc.user.current.query();
  } catch (e) {
    return null;
  }
}
