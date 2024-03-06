import { describe, expect, test } from "vitest";
import { generateCodeFromTemplate } from "./codegen.js";

describe("generateCodeFromTemplate", () => {
  test("generates code from template", () => {
    expect(
      generateCodeFromTemplate({
        input: "foo",
        type: "text",
        maxLength: null,
        shape: "PERSON_FIRST_NAME",
        optionsInput: null,
        templates: {
          text: {
            PERSON_FIRST_NAME: () => '"bar"',
            __DEFAULT: () => '"baz"',
          },
        },
      }),
    ).toEqual('"bar"');
  });

  test("uses default template if there is no matching shape", () => {
    expect(
      generateCodeFromTemplate({
        input: "foo",
        type: "text",
        maxLength: null,
        shape: "PERSON_FIRST_NAME",
        optionsInput: null,
        templates: {
          text: {
            __DEFAULT: () => '"baz"',
          },
        },
      }),
    ).toEqual('"baz"');
  });

  test("uses default template if there is no shape", () => {
    expect(
      generateCodeFromTemplate({
        input: "foo",
        type: "text",
        maxLength: null,
        shape: null,
        optionsInput: null,
        templates: {
          text: {
            PERSON_FIRST_NAME: () => '"bar"',
            __DEFAULT: () => '"baz"',
          },
        },
      }),
    ).toEqual('"baz"');
  });

  test("supports array types", () => {
    expect(
      generateCodeFromTemplate({
        input: "foo",
        type: "text[]",
        maxLength: null,
        shape: null,
        optionsInput: null,
        templates: {
          text: {
            __DEFAULT: () => '"bar"',
          },
        },
      }),
    ).toEqual('["bar"]');

    expect(
      generateCodeFromTemplate({
        input: "foo",
        type: "text[][]",
        maxLength: null,
        shape: null,
        optionsInput: null,
        templates: {
          text: {
            __DEFAULT: () => '"bar"',
          },
        },
      }),
    ).toEqual('[["bar"]]');
  });
});
