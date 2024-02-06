import { loadConfig } from "c12";

interface Config {
  introspect?: {};
  seed?: {
    alias?: {
      inflections?: Record<string, string> | boolean;
    };
    fingerprint?: Record<string, unknown>;
  };
  select?: {};
}

export async function getSeedConfig() {
  const { config } = await loadConfig<Config>({
    name: "snaplet",
  });

  return config;
}
