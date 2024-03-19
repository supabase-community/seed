const PRODUCTION_API_URL = "https://api.snaplet.dev/cli";

export const SNAPLET_API_URL =
  process.env["SNAPLET_API_URL"] ?? PRODUCTION_API_URL;

export const SNAPLET_APP_URL =
  process.env["SNAPLET_APP_URL"] ?? "https://app.snaplet.dev";

export const IS_PRODUCTION = SNAPLET_API_URL === PRODUCTION_API_URL;
