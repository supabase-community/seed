import { getSystemConfig } from '#config/systemConfig.js';
import { trpc } from '#trpc/client.js';

export async function getUser() {
  const isLoggedIn = Boolean(process.env["SNAPLET_ACCESS_TOKEN"]) || Boolean((await getSystemConfig()).userId)

  if (!isLoggedIn) {
    return null
  }

  try {
    return await trpc.user.current.query();
  } catch (e) {
    return null;
  }
}
