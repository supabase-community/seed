import { bits } from "#core/userModels/templates/categories/bits.js";
import { floats } from "#core/userModels/templates/categories/floats.js";
import {
  circle,
  line,
  point,
} from "#core/userModels/templates/categories/geometry.js";
import { integers } from "#core/userModels/templates/categories/integers.js";
import { strings } from "#core/userModels/templates/categories/strings.js";
import { type Templates } from "#core/userModels/templates/types.js";
import { copycatTemplate } from "../../core/userModels/templates/copycat.js";
import { type SQLTypeName } from "./utils.js";

// We want to provide a default set of templates for all types in SQLTypeName so use use Required
export const DEFAULT_SQL_TEMPLATES: Required<Templates<SQLTypeName>> = {
  smallint: integers(2),
  smallserial: integers(2),
  serial2: integers(2),
  int2: integers(2),
  tinyint: integers(1),
  serial: integers(4),
  serial4: integers(4),
  integer: integers(4),
  int: integers(4),
  int4: integers(4),
  bigint: integers(8),
  bigserial: integers(8),
  serial8: integers(8),
  int8: integers(8),
  int16: integers(8),
  int32: integers(8),
  real: floats(4),
  float4: floats(4),
  float: floats(4),
  fixed: floats(4),
  year: integers(4),
  binary: bits,
  varbinary: bits,
  image: bits,
  double: floats(8),
  dec: floats(4),
  numeric: floats(4),
  decimal: floats(4),
  "double precision": floats(8),
  float8: floats(8),
  money: floats(8),
  smallmoney: floats(4),
  bpchar: strings,
  char: strings,
  character: strings,
  "character varying": strings,
  character_data: strings,
  varchar: strings,
  citext: strings,
  text: strings,
  inet: ({ input }) => `copycat.ipv4(${input})`,
  cidr: ({ input }) => `copycat.ipv4(${input})`,
  boolean: ({ input }) => `copycat.bool(${input})`,
  bool: ({ input }) => `copycat.bool(${input})`,
  point: point,
  line: line,
  lseg: line,
  box: line,
  path: line,
  circle: circle,
  macaddr: ({ input }) => `copycat.mac(${input})`,
  macaddr8: ({ input }) => `copycat.mac(${input})`,
  json: ({ input }) =>
    `({ [copycat.word(${input})]: copycat.words(${input}) })`,
  jsonb: ({ input }) =>
    `({ [copycat.word(${input})]: copycat.words(${input}) })`,
  date: copycatTemplate("dateString", {
    options: { minYear: 2020 },
    wrap: (code) => `${code}.slice(0, 10)`,
  }),
  datetime: copycatTemplate("dateString", {
    options: { minYear: 2042 },
  }),
  time: copycatTemplate("dateString", {
    options: { minYear: 2020 },
    wrap: (code) => `${code}.slice(11, 19)`,
  }),
  timestamp: copycatTemplate("dateString", {
    options: { minYear: 2020 },
  }),
  timestamptz: copycatTemplate("dateString", {
    options: { minYear: 2020 },
  }),
  timetz: copycatTemplate("dateString", {
    options: { minYear: 2020 },
  }),
  datetime2: copycatTemplate("dateString", {
    options: { minYear: 2020 },
  }),
  smalldatetime: copycatTemplate("dateString", {
    options: { minYear: 2020 },
  }),
  datetimeoffset: copycatTemplate("dateString", {
    options: { minYear: 2020 },
  }),
  interval: ({ input }) => `copycat.int(${input}, { max: 10 })`,
  tsquery: ({ input }) => `copycat.word(${input})`,
  tsvector: ({ input }) => `copycat.word(${input})`,
  pg_lsn: ({ input }) => `copycat.hex(${input})/copycat.hex(${input})`,
  xml: ({ input }) => `'<' + copycat.word(${input}) + '>' + copycat.words(
      ${input}) + '</' + copycat.word(${input}) + '>'`,
  bit: bits,
  varbit: bits,
  "bit varying": bits,
  bytea: ({ input }) => `copycat.hex(${input})`,
  blob: ({ input }) => `copycat.hex(${input})`,
  uuid: ({ input }) => `copycat.uuid(${input})`,
};
