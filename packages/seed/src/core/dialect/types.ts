import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type Templates } from "#core/userModels/templates/types.js";

export interface Dialect {
  generateClientTypes: GenerateClientTypes;
  templates: Templates;
}

export type GenerateClientTypes = (props: {
  dataModel: DataModel;
  fingerprint?: Fingerprint;
}) => Promise<string> | string;
