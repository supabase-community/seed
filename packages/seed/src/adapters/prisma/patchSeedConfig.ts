import * as R from "remeda";
import { type SeedConfig } from "#config/seedConfig/seedConfig.js";
import { getSelectFilteredDataModel } from "#core/dataModel/select.js";
import {
  type DataModel,
  type DataModelObjectField,
} from "#core/dataModel/types.js";
import { getPrismaDataModel } from "./getPrismaDataModel.js";

const difference = (
  data: Readonly<Array<unknown>>,
  other: Readonly<Array<unknown>>,
) => R.filter(data, R.isNot(R.isIncludedIn(other)));

function matchPrismaField(
  prismaModelFields: Awaited<
    ReturnType<typeof getPrismaDataModel>
  >["datamodel"]["models"][number]["fields"],
  field: DataModelObjectField,
) {
  const prismaField = prismaModelFields.find(
    (pf) =>
      pf.kind === "object" &&
      pf.type === field.type &&
      difference(pf.relationFromFields ?? [], field.relationFromFields)
        .length === 0 &&
      difference(pf.relationToFields ?? [], field.relationToFields).length ===
        0,
  );
  return prismaField;
}

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
            // In the case where the field is a parent relation, we can match the relationFromFields and relationToFields
            if (field.relationFromFields.length > 0) {
              const prismaField = matchPrismaField(prismaModel.fields, field);
              if (prismaField) {
                acc[field.name] = prismaField.name;
              }
            } else {
              // Otherwise the field is a child relation, we need to match the relationFromFields and relationToFields in reverse from the parent
              const parentRelationField = dataModel.models[
                field.type
              ].fields.find(
                (f) =>
                  f.kind === "object" && f.relationName === field.relationName,
              ) as DataModelObjectField;
              const prismaField = matchPrismaField(
                prismaModel.fields,
                parentRelationField,
              );
              if (prismaField) {
                acc[field.name] = prismaField.name;
              }
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
