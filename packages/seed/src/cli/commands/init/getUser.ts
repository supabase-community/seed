import { checkIsLoggedIn } from '#cli/lib/isLoggedIn.js';
import { trpc } from "#trpc/client.js";

export async function getUser() {
  if (!(await checkIsLoggedIn())) {
    return null
  }

  try {
    return await trpc.user.current.query();
  } catch (e) {
    return null;
  }
}
