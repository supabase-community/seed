import { describe, expect, test } from "vitest";
import { generateCodeFromTemplate } from "./codegen.js";

describe("generateCodeFromTemplate", () => {
  test("generates code from template", () => {
    expect(
      generateCodeFromTemplate("foo", "text", null, "PERSON_FIRST_NAME", {
        text: {
          PERSON_FIRST_NAME: () => '"bar"',
          __DEFAULT: () => '"baz"',
        },
      }),
    ).toEqual('"bar"');
  });

  test("uses default template if there is no matching shape", () => {
    expect(
      generateCodeFromTemplate("foo", "text", null, "PERSON_FIRST_NAME", {
        text: {
          __DEFAULT: () => '"baz"',
        },
      }),
    ).toEqual('"baz"');
  });

  test("uses default template if there is no shape", () => {
    expect(
      generateCodeFromTemplate("foo", "text", null, null, {
        text: {
          PERSON_FIRST_NAME: () => '"bar"',
          __DEFAULT: () => '"baz"',
        },
      }),
    ).toEqual('"baz"');
  });

  test("supports array types", () => {
    expect(
      generateCodeFromTemplate("foo", "text[]", null, null, {
        text: {
          __DEFAULT: () => '"bar"',
        },
      }),
    ).toEqual('["bar"]');

    expect(
      generateCodeFromTemplate("foo", "text[][]", null, null, {
        text: {
          __DEFAULT: () => '"bar"',
        },
      }),
    ).toEqual('[["bar"]]');
  });
});
