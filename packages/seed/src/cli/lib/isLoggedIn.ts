import { getSystemConfig } from '#config/systemConfig.js';

export const checkIsLoggedIn = async () => Boolean((await getSystemConfig()).userId) || Boolean(process.env["SNAPLET_ACCESS_TOKEN"])