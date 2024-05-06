import { describe, expect, test } from "vitest";
import {
  createTemplateContext,
  runTemplateCode,
} from "#core/userModels/templates/testing.js";
import { SQL_TEMPLATES } from "./userModels.js";

describe("SQL_TEMPLATES", () => {
  test("evaluation of generated code", () => {
    const results = Object.fromEntries(
      Object.entries(SQL_TEMPLATES).map(([type, rawTemplates]) => {
        const context = createTemplateContext();
        const templates =
          typeof rawTemplates === "function"
            ? { __DEFAULT: rawTemplates }
            : rawTemplates;

        return [
          type,
          Object.fromEntries(
            Object.entries(templates).map(([shape, templateFn]) => {
              const code = templateFn?.(context);
              const result = code ? runTemplateCode(context, code) : null;
              return [shape, result];
            }),
          ),
        ];
      }),
    );

    const geometryTypes = {
      point: results["point"],
      geometry: results["geometry"],
      linestring: results["linestring"],
      polygon: results["polygon"],
      multipoint: results["multipoint"],
      multilinestring: results["multilinestring"],
      multipolygon: results["multipolygon"],
      geomcollection: results["geomcollection"],
    };
    expect(geometryTypes).toMatchInlineSnapshot(`
      {
        "geomcollection": {
          "__DEFAULT": {
            "success": true,
            "value": "GEOMETRYCOLLECTION(POINT(6 6),LINESTRING(6 6, 6 6),POLYGON((6 6, 6 6, 6 6, 6 6, 6 6)))",
          },
        },
        "geometry": {
          "__DEFAULT": {
            "success": true,
            "value": "POINT(6 6)",
          },
        },
        "linestring": {
          "__DEFAULT": {
            "success": true,
            "value": "LINESTRING(6 6, 6 6)",
          },
        },
        "multilinestring": {
          "__DEFAULT": {
            "success": true,
            "value": "MULTILINESTRING((6 6, 6 6), (6 6, 6 6))",
          },
        },
        "multipoint": {
          "__DEFAULT": {
            "success": true,
            "value": "MULTIPOINT(6 6, 6 6, 6 6)",
          },
        },
        "multipolygon": {
          "__DEFAULT": {
            "success": true,
            "value": "MULTIPOLYGON(((6 6, 6 6, 6 6, 6 6, 6 6)), ((6 6, 6 6, 6 6, 6 6, 6 6)))",
          },
        },
        "point": {
          "__DEFAULT": {
            "success": true,
            "value": "POINT(6 6)",
          },
        },
        "polygon": {
          "__DEFAULT": {
            "success": true,
            "value": "POLYGON((6 6, 6 6, 6 6, 6 6, 6 6))",
          },
        },
      }
    `);
  });
});
