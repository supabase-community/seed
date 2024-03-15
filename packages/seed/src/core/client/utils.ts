import { computeIncludedTables } from "#core/dataModel/select.js";
import { type DataModelModel } from "#core/dataModel/types.js";

export function filterModelsBySelectConfig(
  models: Array<DataModelModel>,
  selectConfig?: Record<string, boolean>,
) {
  let fitlteredModels = Object.values(models);
  if (selectConfig !== undefined) {
    const tableIds = Object.values(models).map((model) => model.id);
    const includedTableIds = new Set(
      computeIncludedTables(tableIds, selectConfig),
    );
    fitlteredModels = fitlteredModels.filter((model) =>
      includedTableIds.has(model.id),
    );
  }
  return fitlteredModels;
}
