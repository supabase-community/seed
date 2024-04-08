import { SnapletError } from "#core/utils.js";

const createSeedClient = () => {
  throw new SnapletError("MISSING_CLIENT", undefined);
};

export { createSeedClient };
