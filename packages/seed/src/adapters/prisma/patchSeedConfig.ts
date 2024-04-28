import * as R from "remeda";
import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import { getSelectFilteredDataModel } from "#core/dataModel/select.js";
import { type DataModel } from "#core/dataModel/types.js";
import { getPrismaDataModel } from "./getPrismaDataModel.js";

const difference = (
  data: Readonly<Array<unknown>>,
  other: Readonly<Array<unknown>>,
) => R.filter(data, R.isNot(R.isIncludedIn(other)));

async function getAliasOverride(props: {
  dataModel: DataModel;
  seedConfig: SeedConfig;
}) {
  const aliasOverride: NonNullable<
    NonNullable<SeedConfig["alias"]>["override"]
  > = {};
  const prismaDataModel = await getPrismaDataModel();

  const dataModel = getSelectFilteredDataModel(
    props.dataModel,
    props.seedConfig.select,
  );

  for (const [modelName, model] of Object.entries(dataModel.models)) {
    const prismaModel = prismaDataModel.datamodel.models.find(
      (m) => (m.dbName ?? m.name) === modelName,
    );
    if (prismaModel) {
      aliasOverride[modelName] = {
        name:
          // prisma client uncapitalizes model names, example: User -> prisma.user
          prismaModel.name.charAt(0).toLowerCase() + prismaModel.name.slice(1),
        fields: model.fields.reduce<Record<string, string>>((acc, field) => {
          if (field.kind === "scalar") {
            const prismaField = prismaModel.fields.find(
              (pf) =>
                pf.kind === "scalar" && (pf.dbName ?? pf.name) === field.name,
            );
            if (prismaField) {
              acc[field.name] = prismaField.name;
            }
          } else {
            const prismaField = prismaModel.fields.find(
              (pf) =>
                pf.kind === "object" &&
                pf.type === field.type &&
                difference(
                  pf.relationFromFields ?? [],
                  field.relationFromFields,
                ).length === 0 &&
                difference(pf.relationToFields ?? [], field.relationToFields)
                  .length === 0,
            );
            if (prismaField) {
              acc[field.name] = prismaField.name;
            }
          }
          return acc;
        }, {}),
      };
    }
  }

  return aliasOverride;
}

export async function patchSeedConfig(props: {
  dataModel: DataModel;
  seedConfig: SeedConfig;
}) {
  const aliasOverride = await getAliasOverride(props);

  return {
    ...props.seedConfig,
    alias: {
      ...props.seedConfig.alias,
      override: R.mergeDeep(
        aliasOverride,
        props.seedConfig.alias?.override ?? {},
      ),
    },
  };
}