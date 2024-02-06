import { merge } from "remeda";
import { type SeedClientBase } from "../../core/client/client.js";
import { type SeedClientBaseOptions } from "../../core/client/types.js";
import { type Fingerprint } from "../../core/fingerprint/types.js";

export const setupSeedClient = async <
  Options extends SeedClientBaseOptions,
  SeedClient extends SeedClientBase,
>(
  setupFn: (options?: Options) => Promise<SeedClient> | SeedClient,
  config?: Configuration,
  inputOptions?: Options,
): Promise<SeedClient> => {
  const options = { ...inputOptions };
  const fingerprint = await computeFingerprint(config, options);
  options.fingerprint = fingerprint;

  const seed = await setupFn(options);

  await seed.$syncDatabase();
  seed.$reset();

  return seed;
};

const computeFingerprint = async (
  config?: Configuration,
  options?: SeedClientBaseOptions,
): Promise<Fingerprint> => {
  const fingerprintJson = cloneDeep(readFingerprint());
  const configFingerprint = cloneDeep(
    (await config?.getSeed())?.fingerprint ?? {},
  );
  const optionsFingerprint = cloneDeep(options.fingerprint);

  const fingerprint = merge(
    {},
    fingerprintJson,
    configFingerprint,
    optionsFingerprint,
  );

  return fingerprint;
};
