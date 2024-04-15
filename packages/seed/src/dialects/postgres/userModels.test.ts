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

    expect(results).toMatchInlineSnapshot(`
      {
        "bigint": {
          "INDEX": {
            "success": true,
            "value": 14749868,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 13162868,
          },
        },
        "bigserial": {
          "INDEX": {
            "success": true,
            "value": 14749868,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 13162868,
          },
        },
        "binary": {
          "__DEFAULT": {
            "success": true,
            "value": "0",
          },
        },
        "bit": {
          "__DEFAULT": {
            "success": true,
            "value": "0",
          },
        },
        "bit varying": {
          "__DEFAULT": {
            "success": true,
            "value": "0",
          },
        },
        "blob": {
          "__DEFAULT": {
            "success": true,
            "value": "4",
          },
        },
        "bool": {
          "__DEFAULT": {
            "success": true,
            "value": false,
          },
        },
        "boolean": {
          "__DEFAULT": {
            "success": true,
            "value": false,
          },
        },
        "box": {
          "__DEFAULT": {
            "success": true,
            "value": "(9, 7), (5, 3)",
          },
        },
        "bpchar": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "bytea": {
          "__DEFAULT": {
            "success": true,
            "value": "4",
          },
        },
        "char": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "character": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "character varying": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "character_data": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "cidr": {
          "__DEFAULT": {
            "success": true,
            "value": "226.204.203.201",
          },
        },
        "circle": {
          "__DEFAULT": {
            "success": true,
            "value": "((9, 7 ), 5 )",
          },
        },
        "citext": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "date": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21",
          },
        },
        "datetime": {
          "__DEFAULT": {
            "success": true,
            "value": "2042-05-21T04:57:14.000Z",
          },
        },
        "datetime2": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21T04:57:14.000Z",
          },
        },
        "datetimeoffset": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21T04:57:14.000Z",
          },
        },
        "dec": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "decimal": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "double": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 88.75673522213368,
          },
        },
        "double precision": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 88.75673522213368,
          },
        },
        "fixed": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "float": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "float4": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "float8": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 88.75673522213368,
          },
        },
        "image": {
          "__DEFAULT": {
            "success": true,
            "value": "0",
          },
        },
        "inet": {
          "__DEFAULT": {
            "success": true,
            "value": "226.204.203.201",
          },
        },
        "int": {
          "INDEX": {
            "success": true,
            "value": 7808,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 55668,
          },
        },
        "int16": {
          "INDEX": {
            "success": true,
            "value": 14749868,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 13162868,
          },
        },
        "int2": {
          "INDEX": {
            "success": true,
            "value": 158,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 116,
          },
        },
        "int32": {
          "INDEX": {
            "success": true,
            "value": 14749868,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 13162868,
          },
        },
        "int4": {
          "INDEX": {
            "success": true,
            "value": 7808,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 55668,
          },
        },
        "int8": {
          "INDEX": {
            "success": true,
            "value": 14749868,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 13162868,
          },
        },
        "integer": {
          "INDEX": {
            "success": true,
            "value": 7808,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 55668,
          },
        },
        "interval": {
          "__DEFAULT": {
            "success": true,
            "value": 6,
          },
        },
        "json": {
          "__DEFAULT": {
            "success": true,
            "value": {
              "Aut": "Nec nihillum",
            },
          },
        },
        "jsonb": {
          "__DEFAULT": {
            "success": true,
            "value": {
              "Aut": "Nec nihillum",
            },
          },
        },
        "line": {
          "__DEFAULT": {
            "success": true,
            "value": "(9, 7), (5, 3)",
          },
        },
        "lseg": {
          "__DEFAULT": {
            "success": true,
            "value": "(9, 7), (5, 3)",
          },
        },
        "macaddr": {
          "__DEFAULT": {
            "success": true,
            "value": "af:c7:ef:62:20:9e",
          },
        },
        "macaddr8": {
          "__DEFAULT": {
            "success": true,
            "value": "af:c7:ef:62:20:9e",
          },
        },
        "money": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 88.75673522213368,
          },
        },
        "numeric": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "path": {
          "__DEFAULT": {
            "success": true,
            "value": "(9, 7), (5, 3)",
          },
        },
        "pg_lsn": {
          "__DEFAULT": {
            "success": true,
            "value": 1,
          },
        },
        "point": {
          "__DEFAULT": {
            "success": true,
            "value": "(6,6)",
          },
        },
        "real": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "serial": {
          "INDEX": {
            "success": true,
            "value": 7808,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 55668,
          },
        },
        "serial2": {
          "INDEX": {
            "success": true,
            "value": 158,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 116,
          },
        },
        "serial4": {
          "INDEX": {
            "success": true,
            "value": 7808,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 55668,
          },
        },
        "serial8": {
          "INDEX": {
            "success": true,
            "value": 14749868,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 13162868,
          },
        },
        "smalldatetime": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21T04:57:14.000Z",
          },
        },
        "smallint": {
          "INDEX": {
            "success": true,
            "value": 158,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 116,
          },
        },
        "smallmoney": {
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 5.547295951383355,
          },
        },
        "smallserial": {
          "INDEX": {
            "success": true,
            "value": 158,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 116,
          },
        },
        "text": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "time": {
          "__DEFAULT": {
            "success": true,
            "value": "04:57:14",
          },
        },
        "timestamp": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21T04:57:14.000Z",
          },
        },
        "timestamptz": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21T04:57:14.000Z",
          },
        },
        "timetz": {
          "__DEFAULT": {
            "success": true,
            "value": "2020-05-21T04:57:14.000Z",
          },
        },
        "tinyint": {
          "INDEX": {
            "success": true,
            "value": 1,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 0,
          },
        },
        "tsquery": {
          "__DEFAULT": {
            "success": true,
            "value": "Aut",
          },
        },
        "tsvector": {
          "__DEFAULT": {
            "success": true,
            "value": "Aut",
          },
        },
        "uuid": {
          "__DEFAULT": {
            "success": true,
            "value": "968bab84-2c06-50d5-9538-d1f5c43b1b01",
          },
        },
        "varbinary": {
          "__DEFAULT": {
            "success": true,
            "value": "0",
          },
        },
        "varbit": {
          "__DEFAULT": {
            "success": true,
            "value": "0",
          },
        },
        "varchar": {
          "__DEFAULT": {
            "success": true,
            "value": "Ab causa idit nec modum.",
          },
        },
        "xml": {
          "__DEFAULT": {
            "success": true,
            "value": "<Aut>Nec nihillum</Aut>",
          },
        },
        "year": {
          "INDEX": {
            "success": true,
            "value": 7808,
          },
          "LOCATION_LATITUDE": {
            "success": true,
            "value": 49,
          },
          "LOCATION_LONGITUDE": {
            "success": true,
            "value": 49,
          },
          "__DEFAULT": {
            "success": true,
            "value": 55668,
          },
        },
      }
    `);
  });
});
