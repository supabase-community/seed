import { type DrizzleDbClient } from "#core/adapters.js";

type Parameter =
  | {
      hint?: string;
      kind: "scalar";
      name: string;
    }
  | { kind: "object"; name: string; properties: Record<string, Parameter> };

export interface Driver {
  definitelyTyped?: string;
  getClient(parameters: unknown): Promise<DrizzleDbClient>;
  name: string;
  package: string;
  parameters: Array<Parameter>;
}

type Dialect = Array<Driver>;

export type Dialects = Record<string, Dialect>;
