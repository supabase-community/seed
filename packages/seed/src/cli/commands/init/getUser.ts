import { checkIsLoggedIn } from '#cli/lib/isLoggedIn.js';
import { trpc } from "#trpc/client.js";

export async function getUser() {
  if (!checkIsLoggedIn()) {
    return null
  }

  try {
    return await trpc.user.current.query();
  } catch (e) {
    return null;
  }
}
