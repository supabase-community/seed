import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type UserModels } from "#core/userModels/types.js";

export interface Adapter {
  id: string;
  name: string;
  packageName: string;
  patchSeedConfig?: (props: {
    dataModel: DataModel;
    seedConfig: SeedConfig;
  }) => Promise<SeedConfig>;
  patchUserModels?: (props: {
    dataModel: DataModel;
    userModels: UserModels;
  }) => Promise<UserModels>;
  template: (parameters?: string) => string;
  typesPackageName?: string;
}
