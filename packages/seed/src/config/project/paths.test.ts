import path from "node:path";
import { describe, expect, test } from "vitest";
import { findProjectPath, getProjectConfigPath } from "./paths.js";

describe("project paths", () => {
  const baseFixturePath = path.resolve(
    __dirname,
    "../__fixtures__/paths/project",
  );

  test("the `.snaplet` directory is resolved", async () => {
    const x = await findProjectPath(path.join(baseFixturePath, "valid"));

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(x!.endsWith(".snaplet")).toBe(true);
  });

  test("throws when a `.snaplet` directory cannot be found", async () => {
    try {
      await findProjectPath("/bad/path");
    } catch (e) {
      expect((e as Error).message).toMatchInlineSnapshot(
        `"Could not find a '.snaplet' project directory."`,
      );
    }
  });

  test("throw when an invalid `SNAPLET_CWD` is provided", async () => {
    try {
      process.env["SNAPLET_CWD"] = "/bad/path";
      await findProjectPath();
    } catch (e) {
      expect((e as Error).message).toMatchInlineSnapshot(
        `"The specified 'SNAPLET_CWD' directory '/bad/path' does not exist."`,
      );
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env["SNAPLET_CWD"];
    }
  });

  test("`SNAPLET_CONFIG` overrides default config path", async () => {
    process.env["SNAPLET_CONFIG"] = "/x/config.json";
    const path = await getProjectConfigPath();
    expect(path).toEqual("/x/config.json");
  });
});
