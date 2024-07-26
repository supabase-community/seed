//#region structure
type JsonPrimitive = null | number | string | boolean;
type NestedArray<V> = Array<V | NestedArray<V>>;
type Nested<V> = V | { [s: string]: V | Nested<V> } | Array<V | Nested<V>>;
type Json = Nested<JsonPrimitive>;

interface Table_public_comment {
  "id": string;
  "content": string;
  "userId": string;
  "postId": string;
  "writtenAt": string | null;
}
interface Table_public_post {
  "id": string;
  "title": string;
  "content": string;
  "createdBy": string;
}
interface Table_public_user {
  "id": string;
  "email": string;
  "name": string;
}
interface Schema_public {
  "Comment": Table_public_comment;
  "Post": Table_public_post;
  "User": Table_public_user;
}
interface Database {
  "public": Schema_public;
}
interface Extension {

}
//#endregion

//#region select
type SelectedTable = { id: string; schema: string; table: string };

type SelectDefault = {
  /**
   * Define the "default" behavior to use for the tables in the schema.
   * If true, select all tables in the schema.
   * If false, select no tables in the schema.
   * If "structure", select only the structure of the tables in the schema but not the data.
   * @defaultValue true
   */
  $default?: SelectObject;
};

type DefaultKey = keyof SelectDefault;

type SelectObject = boolean | "structure";

type ExtensionsSelect<TSchema extends keyof Database> =
  TSchema extends keyof Extension
    ? {
        /**
         * Define if you want to select the extension data.
         * @defaultValue false
         */
        $extensions?:
          | boolean
          | {
              [TExtension in Extension[TSchema]]?: boolean;
            };
      }
    : {};

type SelectConfig = SelectDefault & {
  [TSchema in keyof Database]?:
    | SelectObject
    | (SelectDefault &
        ExtensionsSelect<TSchema> & {
          [TTable in keyof Database[TSchema]]?: SelectObject;
        });
};

// Apply the __default key if it exists to each level of the select config (schemas and tables)
type ApplyDefault<TSelectConfig extends SelectConfig> = {
  [TSchema in keyof Database]-?: {
    [TTable in keyof Database[TSchema]]-?: TSelectConfig[TSchema] extends SelectObject
      ? TSelectConfig[TSchema]
      : TSelectConfig[TSchema] extends Record<any, any>
      ? TSelectConfig[TSchema][TTable] extends SelectObject
        ? TSelectConfig[TSchema][TTable]
        : TSelectConfig[TSchema][DefaultKey] extends SelectObject
        ? TSelectConfig[TSchema][DefaultKey]
        : TSelectConfig[DefaultKey] extends SelectObject
        ? TSelectConfig[DefaultKey]
        : true
      : TSelectConfig[DefaultKey] extends SelectObject
      ? TSelectConfig[DefaultKey]
      : true;
  };
};

type ExtractValues<T> = T extends object ? T[keyof T] : never;

type GetSelectedTable<TSelectSchemas extends SelectConfig> = ExtractValues<
  ExtractValues<{
    [TSchema in keyof TSelectSchemas]: {
      [TTable in keyof TSelectSchemas[TSchema] as TSelectSchemas[TSchema][TTable] extends true
        ? TTable
        : never]: TSchema extends string
        ? TTable extends string
          ? { id: `${TSchema}.${TTable}`; schema: TSchema; table: TTable }
          : never
        : never;
    };
  }>
>;
//#endregion

//#region transform
type TransformMode = "auto" | "strict" | "unsafe" | undefined;


type TransformOptions<TTransformMode extends TransformMode> = {
  /**
   * The type for defining the transform mode.
   *
   * There are three modes available:
   *
   * - "auto" - Automatically transform the data for any columns, tables or schemas that have not been specified in the config
   * - "strict" - In this mode, Snaplet expects a transformation to be given in the config for every column in the database. If any columns have not been provided in the config, Snaplet will not capture the snapshot, but instead tell you which columns, tables, or schemas have not been given
   * - "unsafe" - This mode copies over values without any transformation. If a transformation is given for a column in the config, the transformation will be used instead
   * @defaultValue "unsafe"
   */
  $mode?: TTransformMode;
  /**
   * If true, parse JSON objects during transformation.
   * @defaultValue false
   */
  $parseJson?: boolean;
};

type DatabaseWithCallback = {
  [TSchema in keyof Database]: {
    [TTable in keyof Database[TSchema]]:
      | ((ctx: {
          row: Database[TSchema][TTable];
          rowIndex: number;
        }) => Database[TSchema][TTable])
      | Database[TSchema][TTable];
  };
};

type SelectDatabase<TSelectedTable extends SelectedTable> = {
  [TSchema in keyof DatabaseWithCallback as TSchema extends NonNullable<TSelectedTable>["schema"]
    ? TSchema
    : never]: {
    [TTable in keyof DatabaseWithCallback[TSchema] as TTable extends Extract<
      TSelectedTable,
      { schema: TSchema }
    >["table"]
      ? TTable
      : never]: DatabaseWithCallback[TSchema][TTable];
  };
};

type PartialTransform<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => Partial<R>
  : Partial<T>;

type IsNever<T> = [T] extends [never] ? true : false;

type TransformConfig<
  TTransformMode extends TransformMode,
  TSelectedTable extends SelectedTable
> = TransformOptions<TTransformMode> &
  (IsNever<TSelectedTable> extends true
    ? never
    : SelectDatabase<TSelectedTable> extends infer TSelectedDatabase
    ? TTransformMode extends "strict"
      ? TSelectedDatabase
      : {
          [TSchema in keyof TSelectedDatabase]?: {
            [TTable in keyof TSelectedDatabase[TSchema]]?: PartialTransform<
              TSelectedDatabase[TSchema][TTable]
            >;
          };
        }
    : never);
//#endregion

//#region subset
type NonEmptyArray<T> = [T, ...T[]];

/**
 * Represents an exclusive row limit percent.
 */
type ExclusiveRowLimitPercent =
| {
  percent?: never;
  /**
   * Represents a strict limit of the number of rows captured on target
   */
  rowLimit: number
}
| {
  /**
   * Represents a random percent to be captured on target (1-100)
   */
  percent: number;
  rowLimit?: never
}

// Get the type of a target in the config.subset.targets array
type SubsetTarget<TSelectedTable extends SelectedTable> = {
  /**
   * The ID of the table to target
   */
  table: TSelectedTable["id"];
  /**
   * The order on which your target will be filtered useful with rowLimit parameter
   *
   * @example
   * orderBy: `"User"."createdAt" desc`
   */
  orderBy?: string;
} & (
  | {
    /**
     * The where filter to be applied on the target
     *
     * @example
     * where: `"_prisma_migrations"."name" IN ('migration1', 'migration2')`
     */
    where: string
  } & Partial<ExclusiveRowLimitPercent>
  | {
    /**
     * The where filter to be applied on the target
     */
    where?: string
  } & ExclusiveRowLimitPercent
);

/**
 * Represents the configuration for subsetting the snapshot.
 */
type SubsetConfig<TSelectedTable extends SelectedTable> = {
  /**
   * Specifies whether subsetting is enabled.
   *  @defaultValue true
   */
  enabled?: boolean;

  /**
   * Specifies the version of the subsetting algorithm
   *
   * @defaultValue "3"
   * @deprecated
   */
  version?: "1" | "2" | "3";

  /**
   * Specifies whether to eagerly load related tables.
   * @defaultValue false
   */
  eager?: boolean;

  /**
   * Specifies whether to keep tables that are not connected to any other tables.
   * @defaultValue false
   */
  keepDisconnectedTables?: boolean;

  /**
   * Specifies whether to follow nullable relations.
   * @defaultValue false
   */
  followNullableRelations?: boolean;

  /**
   *  Specifies the maximum number of children per node.
   */
  maxChildrenPerNode?: number;

  /**
   * Specifies the maximum number of cycles in a loop.
   * @defaultValue 10
   */
  maxCyclesLoop?: number;

  /**
   * Specifies the root targets for subsetting. Must be a non-empty array
   */
  targets: NonEmptyArray<SubsetTarget<TSelectedTable>>;
}
//#endregion

type Validate<T, Target> = {
  [K in keyof T]: K extends keyof Target ? T[K] : never;
};

type TypedConfig<
  TSelectConfig extends SelectConfig,
  TTransformMode extends TransformMode
> =  GetSelectedTable<
  ApplyDefault<TSelectConfig>
> extends SelectedTable
  ? {
    /**
     * Parameter to configure the generation of data.
     * {@link https://docs.snaplet.dev/references/data-operations/generate}
     */
      generate?: {
        plan: (ctx: { snaplet: import('./snaplet-client').SnapletClient, pipe: import('./snaplet-client').Pipe, merge: import('./snaplet-client').Merge }) => import('./snaplet-client').IPlan;
      };
    /**
     * Parameter to configure the inclusion/exclusion of schemas and tables from the snapshot.
     * {@link https://docs.snaplet.dev/references/data-operations/exclude}
     */
      select?: Validate<TSelectConfig, SelectConfig>;
      /**
       * Parameter to configure the transformations applied to the data.
       * {@link https://docs.snaplet.dev/references/data-operations/transform}
       */
      transform?: TransformConfig<TTransformMode, GetSelectedTable<
  ApplyDefault<TSelectConfig>
>>;
      /**
       * Parameter to capture a subset of the data.
       * {@link https://docs.snaplet.dev/references/data-operations/reduce}
       */
      subset?: SubsetConfig<GetSelectedTable<
  ApplyDefault<TSelectConfig>
>>;
    }
  : never;

declare module "snaplet" {
  /**
  * Define the configuration for Snaplet capture process.
  * {@link https://docs.snaplet.dev/getting-started/data-operations}
  */
  export function defineConfig<
    TSelectConfig extends SelectConfig,
    TTransformMode extends TransformMode = undefined
  >(
    config: TypedConfig<TSelectConfig, TTransformMode>
  ): TypedConfig<TSelectConfig, TTransformMode>;
}