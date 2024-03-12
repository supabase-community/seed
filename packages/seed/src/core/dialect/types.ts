import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type Templates } from "#core/userModels/templates/types.js";
import { type Shape } from "#trpc/shapes.js";
import { type DrizzleDbClient } from "../adapters.js";

export type NestedType = string;

export type WithDbClient = <Result>(props: {
  connectionString: string;
  fn: (client: DrizzleDbClient) => Promise<Result> | Result;
}) => Promise<Result>;

export type GetDataModel = (client: DrizzleDbClient) => Promise<DataModel>;

export interface Dialect {
  determineShapeFromType: DetermineShapeFromType;
  generateClientTypes: GenerateClientTypes;
  getDataModel: GetDataModel;
  templates: Templates;
  withDbClient: WithDbClient;
}

// context(justinvdm, 6 Mar 2024): A `null` result means no shape was determined (so we should ask
// the API for the shape), while `__DEFAULT` means we have intentionally opted out of determining a
// shape and we should instead use the default template for the type
export type DetermineShapeFromType = (type: string) => Shape | null;

export type GenerateClientTypes = (props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) => Promise<string> | string;
