import { expect, test } from "vitest";
import { hello } from "./hello.js";

test("it works", () => {
  expect(hello("world")).toBe("Hello world!");
});
