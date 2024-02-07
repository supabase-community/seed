import { describe, expect, test } from "vitest";
import { run } from "#test";

describe("snaplet hello", () => {
  test("it works", async () => {
    const { stdout } = await run("@snaplet/seed generate Bob");

    expect(stdout).toBe("Hello Bob!");
  });
});
