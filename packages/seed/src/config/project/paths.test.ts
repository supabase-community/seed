import { describe, expect, test } from "vitest";
import { getProjectConfigPath } from "./paths.js";

describe("project paths", () => {
  test("`SNAPLET_CONFIG` overrides default config path", async () => {
    process.env["SNAPLET_CONFIG"] = "/x/config.json";
    const path = await getProjectConfigPath();
    expect(path).toEqual("/x/config.json");
  });
});
