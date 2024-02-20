import { PgTypeName } from '~/pgTypes.js'
import { bits } from '../categories/bits.js'
import { floats } from '../categories/floats.js'
import { circle, line, point } from '../categories/geometry.js'
import { integers } from '../categories/integers.js'
import { strings as baseStrings } from '../categories/strings.js'
import { Templates } from '../types.js'

const strings: typeof baseStrings = {
  ...baseStrings,
  __DEFAULT: ({ input }) => `copycat.scramble(${input})`,
}

export const TRANSFORM_CONFIG_EXAMPLE_TEMPLATES: Templates<PgTypeName> = {
  smallint: integers(2),
  smallserial: integers(2),
  serial2: integers(2),
  int2: integers(2),
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
  numeric: floats(4),
  decimal: floats(4),
  'double precision': floats(8),
  float8: floats(8),
  money: floats(8),
  bpchar: strings,
  character: strings,
  'character varying': strings,
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
  json: {
    STATUS: ({ input }) =>
      `{ status: copycat.oneOf(${input},['error','success','pending'])}`,
    __DEFAULT: ({ input }) =>
      `{ [copycat.word(${input})]: copycat.words(${input}) }`,
  },
  jsonb: {
    STATUS: ({ input }) =>
      `{ status: copycat.oneOf(${input},['error','success','pending'])}`,
    __DEFAULT: ({ input }) =>
      `{ [copycat.word(${input})]: copycat.words(${input}) }`,
  },
  date: {
    DATE_OF_BIRTH: ({ input }) =>
      `copycat.dateString(${input}, { minYear: 1950, maxYear: 2000 }).slice(0, 10)`,
    __DEFAULT: ({ input }) =>
      `copycat.dateString(${input}, { minYear: 2020 }).slice(0, 10)`,
  },
  time: {
    DATE_OF_BIRTH: ({ input }) =>
      `copycat.dateString(${input}, { minYear: 1950, maxYear: 2000 }).slice(11, 19)`,
    __DEFAULT: ({ input }) =>
      `copycat.dateString(${input}, { minYear: 2020 }).slice(11, 19)`,
  },
  timestamp: {
    DATE_OF_BIRTH: ({ input }) =>
      `copycat.dateString(${input}, { minYear: 1950, maxYear: 2000 })`,
    __DEFAULT: ({ input }) => `copycat.dateString(${input}, { minYear: 2020 })`,
  },
  timestamptz: {
    DATE_OF_BIRTH: ({ input }) =>
      `copycat.dateString(${input}, { minYear: 1950, maxYear: 2000 })`,
    __DEFAULT: ({ input }) => `copycat.dateString(${input}, { minYear: 2020 })`,
  },
  interval: ({ input }) => `copycat.int(${input}, { max: 10 })`,
  tsquery: ({ input }) => `copycat.word(${input})`,
  tsvector: ({ input }) => `copycat.word(${input})`,
  pg_lsn: ({ input }) => `copycat.hex(${input})/copycat.hex(${input})`,
  xml: ({ input }) => `'<' + copycat.word(${input}) + '>' + copycat.words(
      ${input}) + '</' + copycat.word(${input}) + '>'`,
  bit: bits,
  varbit: bits,
  'bit varying': bits,
  bytea: ({ input }) => `copycat.hex(${input})`,
  uuid: ({ input }) => `copycat.uuid(${input})`,
}
