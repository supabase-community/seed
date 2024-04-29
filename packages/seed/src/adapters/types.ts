import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type UserModels } from "#core/userModels/types.js";
import { type DialectId } from "#dialects/dialects.js";

export interface Adapter {
  getDialect: () => DialectId | Promise<DialectId>;
  id: string;
  name: string;
  packageName: string;
  patchSeedConfig?: (props: {
    dataModel: DataModel;
    seedConfig: SeedConfig;
  }) => Promise<SeedConfig>;
  patchUserModels?: (props: {
    dataModel: DataModel;
    dialect: DialectId;
    userModels: UserModels;
  }) => Promise<UserModels>;
  template: (parameters?: string) => string;
  typesPackageName?: string;
}
