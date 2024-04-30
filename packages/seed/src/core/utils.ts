import { EOL } from "node:os";
import { type DataModelModel } from "./dataModel/types.js";

export const dedupePreferLast = <Value>(values: Array<Value>): Array<Value> =>
  Array.from(new Set(values.reverse())).reverse();

// context(justinvdm, 18 Jan 2024): In some cases, we cannot rely on native instanceof, since the constructor might
// be an entirely different object. For example:
// * Our code and libraries (e.g. @snaplet/seed) used inside of jest - jest overrides global objects
// * Dual package hazard: (https://nodejs.org/api/packages.html#dual-package-hazard) - this can happen, for e.g, if
// for some reason two versions of our packages or their dependencies end up in the same runtime for a user
// * Comparing values created inside of a sandbox (e.g. an evaluated seed.config.ts file) with constructors created
// outside of that sandbox
export const isInstanceOf = <
  Constructor extends new (...args: Array<unknown>) => unknown,
>(
  v: unknown,
  constructor: Constructor,
): v is InstanceType<Constructor> => {
  if (v instanceof constructor) {
    return true;
  }

  if (v?.constructor.name === constructor.name) {
    return true;
  }

  return false;
};

export function isError(e: unknown): e is Error {
  return Boolean(
    e instanceof Error ||
      // In some case, like jest test running environment, we can't rely on the instanceof
      // operator because jest override global Error object
      // Since some of our sdk code is integrated into the seed client which can be run in test environment
      // we need this custom function to check if an object is an error, or more accurately, if it's 'error like'
      (typeof (e as Error).message === "string" &&
        typeof (e as Error).name === "string" &&
        (e as Error).constructor),
  );
}

export function escapeKey(key: string): string {
  // This regex checks for a valid JavaScript identifier.
  // It should start with a letter, underscore or dollar, followed by zero or more letters, underscores, dollars or digits.
  const isValidIdentifier = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(key);

  if (isValidIdentifier) {
    return key;
  } else {
    return `"${key}"`;
  }
}

const ERROR_CODES = {
  SEED_ALIAS_MODEL_NAME_CONFLICTS: 9300,
  SEED_SELECT_RELATIONSHIP_ERROR: 9301,
  SEED_ADAPTER_CANNOT_CONNECT: 9302,

  SEED_CONFIG_INVALID: 9303,
  SEED_CONFIG_NOT_FOUND: 9304,
  SEED_DATA_MODEL_NOT_FOUND: 9305,
  SEED_DATA_MODEL_INVALID: 9306,
  SNAPLET_FOLDER_NOT_FOUND: 9307,
  SNAPLET_PROJECT_CONFIG_NOT_FOUND: 9308,
  PACKAGE_NOT_EXISTS: 9400,
};

type CodeType = keyof typeof ERROR_CODES;

interface AliasModelNameConflict {
  aliasName: string;
  models: Map<string, DataModelModel>;
}

interface SeedSelectRelationshipError {
  relationName: string;
  relationToTable: string;
}

interface Data extends Record<CodeType, unknown> {
  PACKAGE_NOT_EXISTS: {
    packageName: string;
  };
  SEED_ADAPTER_CANNOT_CONNECT: {
    error: Error;
  };
  SEED_ALIAS_MODEL_NAME_CONFLICTS: {
    conflicts: Array<AliasModelNameConflict>;
  };
  SEED_CONFIG_INVALID: {
    error: Error;
    path: string;
  };
  SEED_CONFIG_NOT_FOUND: {
    path: string;
  };
  SEED_DATA_MODEL_INVALID: {
    error: Error;
    path: string;
  };
  SEED_DATA_MODEL_NOT_FOUND: {
    path: string;
  };
  SEED_SELECT_RELATIONSHIP_ERROR: {
    errors: Array<SeedSelectRelationshipError>;
  };
  SNAPLET_FOLDER_NOT_FOUND: {
    path: string;
  };
  SNAPLET_PROJECT_CONFIG_NOT_FOUND: {
    path: string;
  };
}

// Define a mapping from error codes to functions that return string representations of the errors.
const errorToStringMappings: {
  [K in CodeType]: (data: Data[K]) => string;
} = {
  SEED_ALIAS_MODEL_NAME_CONFLICTS: (data) => {
    const conflicts = data.conflicts
      .map(
        (conflict) => `* Alias "${conflict.aliasName}" maps to: ${[
          ...conflict.models.values(),
        ]
          .map((model) =>
            [model.schemaName, model.tableName].filter(Boolean).join("."),
          )
          .join(", ")}
`,
      )
      .join("\n");

    return `
Your database has some table names that would end up being aliased to the same names. To resolve this, add alias \`overrides\` for these tables in your \`seed.config.ts\` file.

More on this in the docs: https://docs.snaplet.dev/core-concepts/seed#override

The following table names conflict:
${conflicts}
`;
  },
  SEED_SELECT_RELATIONSHIP_ERROR: (data) => {
    const errorDetails = data.errors
      .map(
        (error) =>
          `\n- Relation Name: ${error.relationName}, Relation To Table: ${error.relationToTable}\n`,
      )
      .join("; ");
    return `Select configuration cause constraint relationship error\nDetails: ${errorDetails}`;
  },
  SEED_ADAPTER_CANNOT_CONNECT: (data) =>
    [
      `Unable to connect to the database. Please check the \`adapter\` key in your \`seed.config.ts\` file`,
      `Details: ${data.error}`,
    ].join(EOL),
  PACKAGE_NOT_EXISTS: (data) => {
    return `Please install required package: '${data.packageName}'`;
  },
  SEED_CONFIG_INVALID: (data) => {
    return `Invalid seed config at path: ${data.path}${EOL}${data.error}`;
  },
  SEED_CONFIG_NOT_FOUND: (data) => {
    return [
      `Seed config not found at path: ${data.path}`,
      `run npx @snaplet/seed init to generate it if you haven't already.`,
    ].join(EOL);
  },
  SEED_DATA_MODEL_NOT_FOUND: (data) => {
    return `dataModel.json not found at path: ${data.path}`;
  },
  SEED_DATA_MODEL_INVALID: (data) => {
    return `Invalid dataModel.json at path: ${data.path}${EOL}${data.error}`;
  },
  SNAPLET_FOLDER_NOT_FOUND: (data) => {
    return [
      `.snaplet folder not found at path: ${data.path}`,
      `.snaplet folder must collocate the seed.config.ts file`,
      `run npx @snaplet/seed init if you haven't already.`,
    ].join(EOL);
  },
  SNAPLET_PROJECT_CONFIG_NOT_FOUND: (data) => {
    return [
      `config.json not found at path: ${data.path}`,
      `run npx @snaplet/seed init to generate it if you haven't already.`,
    ].join(EOL);
  },
};

interface SnapletErrorBase<Code extends CodeType = CodeType> {
  readonly _tag: string;
  code: Code;
  data: Data[Code];
  name: string;
}

export class SnapletError<Code extends CodeType = CodeType>
  extends Error
  implements SnapletErrorBase<Code>
{
  static Codes = ERROR_CODES;
  readonly _tag = "SnapletError";

  code: Code;
  data: Data[Code];
  override name = "SnapletError";

  constructor(code: Code, data: Data[Code]) {
    super();

    this.code = code;
    this.data = data;
  }

  static instanceof<Code extends CodeType = CodeType>(
    err: unknown,
    code?: Code,
  ): err is SnapletError<Code> {
    const isSnapletError =
      (err as Record<string, unknown> | undefined)?.["_tag"] === "SnapletError";

    return (
      isSnapletError && (code == null || (err as SnapletError).code === code)
    );
  }

  override toString(): string {
    const formatter = errorToStringMappings[this.code];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (formatter) {
      return `SnapletError: ${SnapletError.Codes[this.code]}\n${formatter(this.data)}`;
    } else {
      return `Unknown error code: ${this.code}`;
    }
  }
}

function jsonReplacer(_key: string, value: unknown) {
  // If the type is a bigint we convert it to a number to jsonify it like a number
  // if the number is above max Number value, we don't handle it and it'll be saved as 3.123e+23
  // which is not the best but will at least be converted back to a number when parsed
  return typeof value === "bigint" ? Number(value) : value;
}

export function jsonStringify(
  value: unknown,
  replacer = jsonReplacer,
  space = 0,
) {
  return JSON.stringify(value, replacer, space);
}

export function createTimer() {
  const start = () => {
    if (self.started) {
      return;
    }

    self.started = true;
    self.startTime = Date.now();
    self.endTime = 0;
    self.duration = 0;
  };

  const stop = () => {
    if (!self.started) {
      return;
    }

    self.started = false;
    self.endTime = Date.now();
    self.duration = self.endTime - self.startTime;
  };

  const wrap = <Result, Args extends Array<unknown>>(
    fn: (...args: Args) => Promise<Result> | Result,
  ): ((...args: Args) => Promise<Result>) => {
    const timerWrappedFn: (...args: Args) => Promise<Result> = async (
      ...args
    ) => {
      self.start();
      try {
        return await fn(...args);
      } finally {
        self.stop();
      }
    };

    return timerWrappedFn;
  };

  const self = {
    started: false,
    startTime: 0,
    endTime: 0,
    duration: 0,
    start,
    stop,
    wrap,
  };

  return self;
}

export type Timer = ReturnType<typeof createTimer>;

export const serializeTimerDurations = (
  timers: Record<string, Timer>,
): Record<string, number> => {
  const results: Partial<Record<string, number>> = {};

  for (const key of Object.keys(timers)) {
    results[key + "Duration"] = timers[key].duration;
  }

  return results as Record<string, number>;
};
