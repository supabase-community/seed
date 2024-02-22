import { describe, expect, test } from "vitest";
import { copycatTemplate, generateCopycatCall } from "./copycat.js";
import { createTemplateContext } from "./testing.js";

describe("copycatTemplate", () => {
  test("defines copycat call template", () => {
    const template = copycatTemplate("email");
    const context = createTemplateContext();
    expect(template(context)).toEqual("copycat.email(input)");
  });

  test("supports providing options", () => {
    const template = copycatTemplate("email", {
      options: { domain: "example.org" },
    });

    const context = createTemplateContext();

    expect(template(context)).toEqual(
      `copycat.email(input, {"domain":"example.org"})`,
    );
  });

  test("supports providing extra args", () => {
    const template = copycatTemplate("oneOfString", {
      args: [["foo", "bar"]],
    });

    const context = createTemplateContext();

    expect(template(context)).toEqual(
      `copycat.oneOfString(input, ["foo","bar"])`,
    );
  });
});

describe("generateCopycatCall", () => {
  test("uses `limit` option for max length fields if copycat method supports it", () => {
    const context = createTemplateContext();
    context.field.maxLength = 50;
    expect(generateCopycatCall(context, "email", ["input"])).toEqual(
      'copycat.email(input, {"limit":50})',
    );
  });

  test("uses truncation for max length fields if copycat method does not support `limit` option", () => {
    const context = createTemplateContext();
    context.field.maxLength = 50;
    expect(generateCopycatCall(context, "dateString", ["input"])).toEqual(
      "copycat.dateString(input).slice(0, 50)",
    );
  });

  test("supports providing extra options", () => {
    const context = createTemplateContext();
    context.field.maxLength = 50;
    expect(
      generateCopycatCall(context, "email", ["input"], {
        domain: "example.org",
      }),
    ).toEqual('copycat.email(input, {"domain":"example.org","limit":50})');
  });

  test("stringifies non-string results for string fields", () => {
    const context = createTemplateContext();
    expect(generateCopycatCall(context, "int", ["input"])).toEqual(
      "copycat.int(input).toString()",
    );
  });

  test("does not stringify non-string results for non-string fields", () => {
    const context = createTemplateContext();
    context.jsType = "number";
    expect(generateCopycatCall(context, "int", ["input"])).toEqual(
      "copycat.int(input)",
    );
  });
});
