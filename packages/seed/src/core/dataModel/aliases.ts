import { camelize, pluralize, singularize, underscore } from "inflection";
import { merge } from "remeda";
import { SnapletError } from "../utils.js";
import {
  type DataModel,
  type DataModelModel,
  type DataModelObjectField,
} from "./types.js";

export type Aliases = Record<
  string,
  {
    fields: Record<string, string>;
    name: string;
  }
>;

export interface AliasModelNameConflict {
  aliasName: string;
  models: Map<string, DataModelModel>;
}

// inspired by https://www.graphile.org/postgraphile/inflection/
export interface Inflection {
  childField: (
    field: Field,
    oppositeField: Field,
    oppositeBaseNameMap: Record<string, string>,
  ) => string;
  modelName: (modelName: string) => string;
  oppositeBaseNameMap: Record<string, string>;
  parentField: (
    field: Field,
    oppositeBaseNameMap: Record<string, string>,
  ) => string;
  scalarField: (
    field: Omit<Field, "relationFromFields" | "relationToFields">,
  ) => string;
}

export const OPPOSITE_BASE_NAME_MAP: Record<string, string> = {
  parent: "child",
  child: "parent",
  author: "authored",
  editor: "edited",
  reviewer: "reviewed",
};

export const standardInflection: Inflection = {
  modelName: computeModelNameAlias,
  scalarField: computeScalarFieldAlias,
  parentField: computeParentFieldAlias,
  childField: computeChildFieldAlias,
  oppositeBaseNameMap: OPPOSITE_BASE_NAME_MAP,
};

export const identityInflection: Inflection = {
  modelName: (modelName) => modelName,
  scalarField: (field) => field.name,
  parentField: (field) => field.name,
  childField: (field) => field.name,
  oppositeBaseNameMap: {},
};

export function computeAliases(dataModel: DataModel, inflection: Inflection) {
  const aliases: Aliases = {};

  for (const [modelName, modelValues] of Object.entries(dataModel.models)) {
    const name = inflection.modelName(modelName);

    aliases[modelName] = {
      name,
      fields: {},
    };

    const aliasedFields: Record<string, string> = {};
    for (const field of modelValues.fields) {
      switch (field.kind) {
        case "object":
          if (field.isList) {
            const oppositeField = dataModel.models[field.type].fields.find(
              (f) =>
                f.kind === "object" && f.relationName === field.relationName,
            ) as DataModelObjectField;

            aliasedFields[field.name] = inflection.childField(
              field,
              oppositeField,
              inflection.oppositeBaseNameMap,
            );
          } else {
            aliasedFields[field.name] = inflection.parentField(
              field,
              inflection.oppositeBaseNameMap,
            );
          }
          break;
        case "scalar":
          aliasedFields[field.name] = inflection.scalarField(field);
      }
    }
    aliases[modelName].fields = aliasedFields;
  }

  let conflicts = computeModelNameConflicts(dataModel, aliases);

  conflicts = attemptResolveModelNameConflicts(conflicts, aliases, inflection);

  if (conflicts.length > 0) {
    throw new SnapletError("SEED_ALIAS_MODEL_NAME_CONFLICTS", {
      conflicts,
    });
  }

  return aliases;
}

const computeModelNameConflicts = (
  dataModel: DataModel,
  aliases: Aliases,
): Array<AliasModelNameConflict> => {
  const conflicts: Array<AliasModelNameConflict> = [];
  const aliasesByName = new Map<string, Map<string, DataModelModel>>();

  for (const [modelName, alias] of Object.entries(aliases)) {
    aliasesByName.set(
      alias.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new Map([
        ...(aliasesByName.get(alias.name) ?? new Map()).entries(),
        [modelName, dataModel.models[modelName]],
      ]),
    );
  }

  for (const [aliasName, models] of aliasesByName) {
    if (models.size > 1) {
      conflicts.push({
        aliasName,
        models,
      });
    }
  }

  return conflicts;
};

const attemptResolveModelNameConflicts = (
  conflicts: Array<AliasModelNameConflict>,
  aliases: Aliases,
  inflection: Inflection,
) => {
  const remainingConflicts: Array<AliasModelNameConflict> = [];

  for (const conflict of conflicts) {
    const schemaNames = [...conflict.models.values()].map(
      (model) => model.schemaName,
    );

    // context(justinvdm, 31 Jan 2024): Two tables have the same schema (or no schema),
    // so we cannot solve the conflict
    if (schemaNames.length > new Set(schemaNames).size) {
      remainingConflicts.push(conflict);
    } else {
      for (const [modelName, model] of conflict.models) {
        if (model.schemaName) {
          const aliasName = inflection.modelName(
            `${model.schemaName}__${model.tableName}`,
          );

          aliases[modelName].name = aliasName;
        }
      }
    }
  }

  return remainingConflicts;
};

interface Field {
  name: string;
  relationFromFields: Array<string>;
  relationToFields: Array<string>;
  type: string;
}

function computeModelNameAlias(modelName: string) {
  return pluralize(camelize(modelName, true));
}

function computeScalarFieldAlias(
  field: Omit<Field, "relationFromFields" | "relationToFields">,
) {
  return camelize(field.name, true);
}

function getBaseName(field: Field) {
  const fromField = underscore(field.relationFromFields[0]);
  const toField = underscore(field.relationToFields[0]);

  // example: { fromField: 'author_id', toField: 'id' } -> author
  if (fromField.endsWith(`_${toField}`)) {
    return fromField.slice(0, fromField.length - toField.length - 1);
  }

  // example: { fromField: 'user_id', toField: 'user_id' } -> user
  if (fromField === toField) {
    return fromField.slice(0, fromField.lastIndexOf("_"));
  }

  // example: { fromField: 'author_id', toField: 'user_id', toTable: 'user' } -> author
  const toTable = singularize(underscore(field.type));
  const toFieldWithoutToTable = toField.startsWith(`${toTable}_`)
    ? toField.slice(toTable.length + 1)
    : toField;

  if (fromField.endsWith(`_${toFieldWithoutToTable}`)) {
    return fromField.slice(
      0,
      fromField.length - toFieldWithoutToTable.length - 1,
    );
  }

  return undefined;
}

function computeParentFieldAlias(
  field: Field,
  oppositeBaseNameMap: Record<string, string>,
) {
  const fromField = underscore(field.relationFromFields[0]);
  const baseName = getBaseName(field);

  // { fromField: 'author_id' } -> author
  if (baseName) {
    return singularize(camelize(baseName, true));
  }

  // { fromField: 'valitated_by' } -> validator
  if (fromField.endsWith("_by")) {
    const oppositeBaseName = fromField.slice(0, -"_by".length);
    const baseNameEntry = Object.entries(oppositeBaseNameMap).find(
      ([_, _oppositeBaseName]) => oppositeBaseName === _oppositeBaseName,
    );
    if (baseNameEntry) {
      return camelize(baseNameEntry[0], true);
    }
  }

  const tableName = singularize(underscore(field.type));
  return camelize(`${tableName}_by_${fromField}`, true);
}

function computeChildFieldAlias(
  field: Field,
  oppositeField: Field,
  oppositeBaseNameMap: Record<string, string>,
) {
  const fromField = underscore(oppositeField.relationFromFields[0]);
  const toField = underscore(oppositeField.relationToFields[0]);
  const tableName = singularize(underscore(oppositeField.type));
  const fieldAlias = computeModelNameAlias(field.type);

  // { fromField: 'post_id', toField: 'id', tableName: 'post' } -> posts
  if (fromField === `${tableName}_${toField}` || fromField === toField) {
    return fieldAlias;
  }

  // { fromField: 'validated_by' } -> validatedPosts
  if (fromField.endsWith("_by")) {
    const oppositeBaseName = fromField.slice(0, -"_by".length);
    return camelize(`${oppositeBaseName}_${fieldAlias}`, true);
  }

  // { baseName: 'author' } -> authoredPosts
  const baseName = getBaseName(oppositeField);
  if (baseName) {
    const oppositeBaseName = oppositeBaseNameMap[baseName];
    if (oppositeBaseName) {
      return camelize(`${oppositeBaseName}_${fieldAlias}`, true);
    }
  }

  return camelize(`${fieldAlias}_by_${fromField}`, true);
}

export function applyAliasesToDataModel(
  dataModel: DataModel,
  aliases: Aliases,
) {
  const aliasedDataModel: DataModel = {
    models: {},
    enums: dataModel.enums,
  };

  for (const [modelName, modelValues] of Object.entries(dataModel.models)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (aliases[modelName]) {
      const { name, fields } = aliases[modelName];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const aliasedModelName = name ?? modelName;
      const aliasedModelValues = {
        ...modelValues,
        fields: modelValues.fields.map((field) => {
          if (field.kind === "object") {
            return {
              ...field,
              name: fields[field.name] ?? field.name,
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              type: aliases[field.type].name ?? field.type,
              relationFromFields: field.relationFromFields.map(
                (f) => fields[f],
              ),
              relationToFields: field.relationToFields.map(
                (f) => aliases[field.type].fields[f],
              ),
            };
          }
          return {
            ...field,
            name: fields[field.name] ?? field.name,
          };
        }),
        uniqueConstraints: modelValues.uniqueConstraints.map((constraint) => {
          // TODO: maybe change the shape of uniqueConstraints to be more consistent with fields
          return {
            ...constraint,
            fields: constraint.fields.map((column) => fields[column]),
          };
        }),
      };
      aliasedDataModel.models[aliasedModelName] = aliasedModelValues;
    } else {
      aliasedDataModel.models[modelName] = modelValues;
    }
  }

  return aliasedDataModel;
}

export function getAliasedDataModel(
  dataModel: DataModel,
  options?: {
    inflection?: Partial<Inflection> | boolean;
    override?: Record<
      string,
      {
        fields?: Record<string, string>;
        name?: string;
      }
    >;
  },
) {
  let inflection = identityInflection;
  if (options?.inflection === undefined || options.inflection === true) {
    inflection = standardInflection;
  } else if (options.inflection !== false) {
    inflection = {
      ...standardInflection,
      ...options.inflection,
      oppositeBaseNameMap: {
        ...standardInflection.oppositeBaseNameMap,
        ...options.inflection.oppositeBaseNameMap,
      },
    };
  }

  const aliases = merge(
    computeAliases(dataModel, inflection),
    options?.override,
  );
  return applyAliasesToDataModel(dataModel, aliases);
}
