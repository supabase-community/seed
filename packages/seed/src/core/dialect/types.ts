import { type Shape } from "#trpc/shapes.js";
import { type DataModel } from "../dataModel/types.js";
import { type Fingerprint } from "../fingerprint/types.js";
import { type Templates } from "../userModels/templates/types.js";

export type NestedType = string;

export interface Dialect {
  determineShapeFromType: DetermineShapeFromType;
  generateClientTypes: GenerateClientTypes;
  templates: Templates;
}

// context(justinvdm, 6 Mar 2024): A `null` result means no shape was determined (so we should ask
// the API for the shape), while `__DEFAULT` means we have intentionally opted out of determining a
// shape and we should instead use the default template for the type
export type DetermineShapeFromType = (type: string) => Shape | null;

export type GenerateClientTypes = (props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) => Promise<string> | string;
