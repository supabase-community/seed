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

  test("supports a wrapper function", () => {
    const template = copycatTemplate("email", {
      wrap: (code: string) => `[[${code}]]`,
    });

    const context = createTemplateContext();

    expect(template(context)).toEqual(`[[copycat.email(input)]]`);
  });
});

describe("generateCopycatCall", () => {
  test("uses `limit` option for max length fields if copycat method supports it", () => {
    const context = createTemplateContext();
    context.maxLength = 50;
    expect(
      generateCopycatCall({
        context,
        methodName: "email",
        inputs: ["input"],
        isString: true,
      }),
    ).toEqual('copycat.email(input, {"limit":50})');
  });

  test("uses truncation for max length fields if copycat method does not support `limit` option", () => {
    const context = createTemplateContext();
    context.maxLength = 50;
    expect(
      generateCopycatCall({
        context,
        methodName: "dateString",
        inputs: ["input"],
        isString: true,
      }),
    ).toEqual("copycat.dateString(input).slice(0, 50)");
  });

  test("supports providing extra options", () => {
    const context = createTemplateContext();
    context.maxLength = 50;
    expect(
      generateCopycatCall({
        context,
        methodName: "email",
        inputs: ["input"],
        isString: true,
        extraOptions: {
          domain: "example.org",
        },
      }),
    ).toEqual('copycat.email(input, {"domain":"example.org","limit":50})');
  });

  test("stringifies non-string results for string fields", () => {
    const context = createTemplateContext();
    expect(
      generateCopycatCall({
        context,
        methodName: "int",
        inputs: ["input"],
        isString: true,
      }),
    ).toEqual("copycat.int(input).toString()");
  });

  test("does not stringify non-string results for non-string fields", () => {
    const context = createTemplateContext();
    expect(
      generateCopycatCall({
        context,
        methodName: "int",
        inputs: ["input"],
        isString: false,
      }),
    ).toEqual("copycat.int(input)");
  });

  test("does not truncate for non-string fields", () => {
    const context = createTemplateContext();
    context.maxLength = 50;
    expect(
      generateCopycatCall({
        context,
        methodName: "int",
        inputs: ["input"],
        isString: false,
      }),
    ).toEqual("copycat.int(input)");
  });

  test("generates options when both optionsInput and extra options are given", () => {
    const context = createTemplateContext();
    context.optionsInput = "opts";

    expect(
      generateCopycatCall({
        context,
        methodName: "email",
        inputs: ["input"],
        isString: true,
        extraOptions: {
          domain: "example.org",
        },
      }),
    ).toEqual('copycat.email(input, { ...{"domain":"example.org"}, ...opts })');
  });

  test("generates options when optionsInput is given and limit is relevant", () => {
    const context = createTemplateContext();
    context.maxLength = 50;
    context.optionsInput = "opts";

    expect(
      generateCopycatCall({
        context,
        methodName: "email",
        inputs: ["input"],
        isString: true,
      }),
    ).toEqual('copycat.email(input, { ...{"limit":50}, ...opts })');
  });

  test("generates options when all of optionsInput, extra options and limit is relevant", () => {
    const context = createTemplateContext();
    context.maxLength = 50;
    context.optionsInput = "opts";

    expect(
      generateCopycatCall({
        context,
        methodName: "email",
        inputs: ["input"],
        isString: true,
        extraOptions: {
          domain: "example.org",
        },
      }),
    ).toEqual(
      'copycat.email(input, { ...{"domain":"example.org","limit":50}, ...opts })',
    );
  });

  test("generates options when optionsInput given but no other options are relevant", () => {
    const context = createTemplateContext();
    context.optionsInput = "opts";

    expect(
      generateCopycatCall({
        context,
        methodName: "email",
        inputs: ["input"],
        isString: true,
      }),
    ).toEqual("copycat.email(input, opts)");
  });
});
