import path from "node:path";
import { describe, expect, test } from "vitest";
import { getProjectConfig, saveProjectConfig } from "./projectConfig.js";

describe("project config", () => {
  const FIXTURES_BASE_PATH = path.resolve(
    __dirname,
    "../__fixtures__/configs/project",
  );

  test("getProjectConfig", async () => {
    const validPath = path.join(FIXTURES_BASE_PATH, "valid");
    const snapletProjectConfigPath = path.join(
      validPath,
      ".snaplet/config.json",
    );

    const currentConfig = await getProjectConfig(snapletProjectConfigPath);
    expect(currentConfig).toEqual({ projectId: "qwerty123" });
  });

  test("saveProjectConfig", async () => {
    const validPath = path.join(FIXTURES_BASE_PATH, "valid");
    const snapletProjectConfigPath = path.join(
      validPath,
      ".snaplet/config.json",
    );
    const newConfig = { projectId: "modified" };
    await saveProjectConfig({
      config: newConfig,
      configPath: snapletProjectConfigPath,
    });

    const currentConfig = await getProjectConfig(snapletProjectConfigPath);
    expect(currentConfig).toEqual(newConfig);
    // Reset the config
    await saveProjectConfig({
      config: { projectId: "qwerty123" },
      configPath: snapletProjectConfigPath,
    });
  });
});
