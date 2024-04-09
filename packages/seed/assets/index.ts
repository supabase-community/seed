const createSeedClient = () => {
  throw new Error(
    "@snaplet/seed client is missing. Please use npx @snaplet/seed sync or npx @snaplet/seed generate to generate the client.",
  );
};

export { createSeedClient };
