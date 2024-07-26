export const snapletClientTypes = `type JsonPrimitive = null | number | string | boolean;
type NestedArray<V> = Array<V | NestedArray<V>>;
type Nested<V> = V | { [s: string]: V | Nested<V> } | Array<V | Nested<V>>;
type Json = Nested<JsonPrimitive>;
type ScalarField<T> = T | ((context: { seed: string }) => Promise<T> | T);
type MapScalarField<T extends Record<string, any>> = {
  [K in keyof T]: ScalarField<T[K]>;
};
type ModelInputs<
  TFields extends Record<string, any>,
  TParents extends Record<string, any> = {},
  TChildren extends Record<string, any> = {}
> = {
  data?: Partial<MapScalarField<TFields> & TParents & TChildren>;
  count?: number | ((context: { seed: string }) => number);
  connect?: (context: { seed: string; store: Store }) => TFields | undefined;
};
type OmitDataFields<
  T extends { data?: Record<string, any> },
  TKeys extends keyof NonNullable<T["data"]>
> = Omit<T, "data"> & { data?: Omit<NonNullable<T["data"]>, TKeys> };
export interface IPlan {
  generate: () => Promise<Store>;
}
interface Plan extends IPlan {
  pipe: Pipe;
  merge: Merge;
}
export type Pipe = (plans: IPlan[]) => IPlan;
export type Merge =  (plans: IPlan[]) => IPlan;
type Store = {
  Comment: Comment[];
  Post: Post[];
  User: User[];
};

type Comment = {
  "content": string;
  "id": string;
  "postId": string;
  "userId": string;
  "writtenAt": string | null;
}
type CommentParents = {
 Post: OmitDataFields<PostModel, "Comment">;
 User: OmitDataFields<UserModel, "Comment">;
};
type CommentChildren = {

};
type CommentModel = ModelInputs<Comment, CommentParents, CommentChildren>;
type Post = {
  "content": string;
  "createdBy": string;
  "id": string;
  "title": string;
}
type PostParents = {
 User: OmitDataFields<UserModel, "Post">;
};
type PostChildren = {
 Comment: OmitDataFields<CommentModel, "Post">;
};
type PostModel = ModelInputs<Post, PostParents, PostChildren>;
type User = {
  "email": string;
  "id": string;
  "name": string;
}
type UserParents = {

};
type UserChildren = {
 Comment: OmitDataFields<CommentModel, "User">;
 Post: OmitDataFields<PostModel, "User">;
};
type UserModel = ModelInputs<User, UserParents, UserChildren>;
export type SnapletClient = {
  Comment: (inputs: CommentModel) => Plan;
  Post: (inputs: PostModel) => Plan;
  User: (inputs: UserModel) => Plan;
};`;

export const snapletTypes = `//#region structure
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
          ? { id: \`\${TSchema}.\${TTable}\`; schema: TSchema; table: TTable }
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
   * orderBy: \`"User"."createdAt" desc\`
   */
  orderBy?: string;
} & (
  | {
    /**
     * The where filter to be applied on the target
     *
     * @example
     * where: \`"_prisma_migrations"."name" IN ('migration1', 'migration2')\`
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
}`;

export const snapletConfig = `import { defineConfig } from 'snaplet';
import { copycat } from '@snaplet/copycat';

export default defineConfig({
  generate: {
    plan({ snaplet }) {
      return snaplet.Post({
        data: {
          title: 'There is a lot of snow around here!',
          User: {
            data: {
              email: ({ seed }) => copycat.email(seed, { domain: 'acme.org' }),
            },
          },
          Comment: {
            count: 3,
          },
        },
      })
    },
  },
});`;

export const fakerDefs = `
declare module '@faker-js/faker' {
  // Generated by dts-bundle-generator v8.0.1
  // and edited by hand to fix some of the types

  declare class AnimalModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random dog breed.
     *
     * @example
     * faker.animal.dog() // 'Irish Water Spaniel'
     *
     * @since 5.5.0
     */
    dog(): string;
    /**
     * Returns a random cat breed.
     *
     * @example
     * faker.animal.cat() // 'Singapura'
     *
     * @since 5.5.0
     */
    cat(): string;
    /**
     * Returns a random snake species.
     *
     * @example
     * faker.animal.snake() // 'Eyelash viper'
     *
     * @since 5.5.0
     */
    snake(): string;
    /**
     * Returns a random bear species.
     *
     * @example
     * faker.animal.bear() // 'Asian black bear'
     *
     * @since 5.5.0
     */
    bear(): string;
    /**
     * Returns a random lion species.
     *
     * @example
     * faker.animal.lion() // 'Northeast Congo Lion'
     *
     * @since 5.5.0
     */
    lion(): string;
    /**
     * Returns a random cetacean species.
     *
     * @example
     * faker.animal.cetacean() // 'Spinner Dolphin'
     *
     * @since 5.5.0
     */
    cetacean(): string;
    /**
     * Returns a random horse breed.
     *
     * @example
     * faker.animal.horse() // 'Swedish Warmblood'
     *
     * @since 5.5.0
     */
    horse(): string;
    /**
     * Returns a random bird species.
     *
     * @example
     * faker.animal.bird() // 'Buller's Shearwater'
     *
     * @since 5.5.0
     */
    bird(): string;
    /**
     * Returns a random cow species.
     *
     * @example
     * faker.animal.cow() // 'Brava'
     *
     * @since 5.5.0
     */
    cow(): string;
    /**
     * Returns a random fish species.
     *
     * @example
     * faker.animal.fish() // 'Mandarin fish'
     *
     * @since 5.5.0
     */
    fish(): string;
    /**
     * Returns a random crocodilian species.
     *
     * @example
     * faker.animal.crocodilia() // 'Philippine Crocodile'
     *
     * @since 5.5.0
     */
    crocodilia(): string;
    /**
     * Returns a random insect species.
     *
     * @example
     * faker.animal.insect() // 'Pyramid ant'
     *
     * @since 5.5.0
     */
    insect(): string;
    /**
     * Returns a random rabbit species.
     *
     * @example
     * faker.animal.rabbit() // 'Florida White'
     *
     * @since 5.5.0
     */
    rabbit(): string;
    /**
     * Returns a random rodent breed.
     *
     * @example
     * faker.animal.rodent() // 'Cuscomys ashanika'
     *
     * @since 7.4.0
     */
    rodent(): string;
    /**
     * Returns a random animal type.
     *
     * @example
     * faker.animal.type() // 'crocodilia'
     *
     * @since 5.5.0
     */
    type(): string;
  }
  declare enum CssSpace {
    SRGB = "sRGB",
    DisplayP3 = "display-p3",
    REC2020 = "rec2020",
    A98RGB = "a98-rgb",
    ProphotoRGB = "prophoto-rgb"
  }
  type CssSpaceType = \`\${CssSpace}\`;
  declare enum CssFunction {
    RGB = "rgb",
    RGBA = "rgba",
    HSL = "hsl",
    HSLA = "hsla",
    HWB = "hwb",
    CMYK = "cmyk",
    LAB = "lab",
    LCH = "lch",
    COLOR = "color"
  }
  type CssFunctionType = \`\${CssFunction}\`;
  type StringColorFormat = "css" | "binary";
  type NumberColorFormat = "decimal";
  type ColorFormat = StringColorFormat | NumberColorFormat;
  type Casing = "lower" | "upper" | "mixed";
  declare class ColorModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random human-readable color name.
     *
     * @example
     * faker.color.human() // 'red'
     *
     * @since 7.0.0
     */
    human(): string;
    /**
     * Returns a random color space name from the worldwide accepted color spaces.
     * Source: https://en.wikipedia.org/wiki/List_of_color_spaces_and_their_uses
     *
     * @example
     * faker.color.space() // 'sRGB'
     *
     * @since 7.0.0
     */
    space(): string;
    /**
     * Returns a random css supported color function name.
     *
     * @example
     * faker.color.cssSupportedFunction() // 'rgb'
     *
     * @since 7.0.0
     */
    cssSupportedFunction(): CssFunctionType;
    /**
     * Returns a random css supported color space name.
     *
     * @example
     * faker.color.cssSupportedSpace() // 'display-p3'
     *
     * @since 7.0.0
     */
    cssSupportedSpace(): CssSpaceType;
    /**
     * Returns an RGB color.
     *
     * @example
     * faker.color.rgb() // '#8be4ab'
     *
     * @since 7.0.0
     */
    rgb(): string;
    /**
     * Returns an RGB color.
     *
     * @param options Options object.
     * @param options.prefix Prefix of the generated hex color. Only applied when 'hex' format is used. Defaults to \`'#'\`.
     * @param options.casing Letter type case of the generated hex color. Only applied when \`'hex'\` format is used. Defaults to \`'lower'\`.
     * @param options.format Format of generated RGB color. Defaults to \`hex\`.
     * @param options.includeAlpha Adds an alpha value to the color (RGBA). Defaults to \`false\`.
     *
     * @example
     * faker.color.rgb() // '#0d7f26'
     * faker.color.rgb({ prefix: '0x' }) // '0x9ddc8b'
     * faker.color.rgb({ casing: 'upper' }) // '#B8A51E'
     * faker.color.rgb({ casing: 'lower' }) // '#b12f8b'
     * faker.color.rgb({ prefix: '#', casing: 'lower' }) // '#eb0c16'
     * faker.color.rgb({ format: 'hex', casing: 'lower' }) // '#bb9d17'
     * faker.color.rgb({ format: 'css' }) // 'rgb(216, 17, 192)'
     * faker.color.rgb({ format: 'binary' }) // '00110010 00001000 01110110'
     * faker.color.rgb({ includeAlpha: true }) // '#f96efb5e'
     * faker.color.rgb({ format: 'css', includeAlpha: true }) // 'rgba(180, 158, 24, 0.75)'
     *
     * @since 7.0.0
     */
    rgb(options?: {
      /**
       * Prefix of the generated hex color. Only applied when 'hex' format is used.
       *
       * @default '#'
       */
      prefix?: string;
      /**
       * Letter type case of the generated hex color. Only applied when \`'hex'\` format is used.
       *
       * @default 'lower'
       */
      casing?: Casing;
      /**
       * Format of generated RGB color.
       *
       * @default 'hex'
       */
      format?: "hex" | StringColorFormat;
      /**
       * Adds an alpha value to the color (RGBA).
       *
       * @default false
       */
      includeAlpha?: boolean;
    }): string;
    /**
     * Returns an RGB color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'hex'\`.
     * @param options.includeAlpha Adds an alpha value to the color (RGBA). Defaults to \`false\`.
     *
     * @example
     * faker.color.rgb() // '0x8be4ab'
     * faker.color.rgb({ format: 'decimal' }) // [64, 192,174]
     * faker.color.rgb({ format: 'decimal', includeAlpha: true }) // [52, 250, 209, 0.21]
     *
     * @since 7.0.0
     */
    rgb(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'hex'
       */
      format?: NumberColorFormat;
      /**
       * Adds an alpha value to the color (RGBA).
       *
       * @default false
       */
      includeAlpha?: boolean;
    }): number[];
    /**
     * Returns an RGB color.
     *
     * @param options Options object.
     * @param options.prefix Prefix of the generated hex color. Only applied when \`'hex'\` format is used. Defaults to \`'#'\`.
     * @param options.casing Letter type case of the generated hex color. Only applied when \`'hex'\` format is used. Defaults to \`'lower'\`.
     * @param options.format Format of generated RGB color. Defaults to \`'hex'\`.
     * @param options.includeAlpha Adds an alpha value to the color (RGBA). Defaults to \`false\`.
     *
     * @example
     * faker.color.rgb() // '#0d7f26'
     * faker.color.rgb({ prefix: '0x' }) // '0x9ddc8b'
     * faker.color.rgb({ casing: 'upper' }) // '#B8A51E'
     * faker.color.rgb({ casing: 'lower' }) // '#b12f8b'
     * faker.color.rgb({ prefix: '#', casing: 'lower' }) // '#eb0c16'
     * faker.color.rgb({ format: 'hex', casing: 'lower' }) // '#bb9d17'
     * faker.color.rgb({ format: 'decimal' }) // [64, 192,174]
     * faker.color.rgb({ format: 'css' }) // 'rgb(216, 17, 192)'
     * faker.color.rgb({ format: 'binary' }) // '00110010 00001000 01110110'
     * faker.color.rgb({ includeAlpha: true }) // '#f96efb5e'
     * faker.color.rgb({ format: 'css', includeAlpha: true }) // 'rgba(180, 158, 24, 0.75)'
     * faker.color.rgb({ format: 'decimal', includeAlpha: true }) // [52, 250, 209, 0.21]
     *
     * @since 7.0.0
     */
    rgb(options?: {
      /**
       * Prefix of the generated hex color. Only applied when \`'hex'\` format is used.
       *
       * @default '#'
       */
      prefix?: string;
      /**
       * Letter type case of the generated hex color. Only applied when \`'hex'\` format is used.
       *
       * @default 'lower'
       */
      casing?: Casing;
      /**
       * Format of generated RGB color.
       *
       * @default 'hex'
       */
      format?: "hex" | ColorFormat;
      /**
       * Adds an alpha value to the color (RGBA).
       *
       * @default false
       */
      includeAlpha?: boolean;
    }): string | number[];
    /**
     * Returns a CMYK color.
     *
     * @example
     * faker.color.cmyk() // [0.31, 0.52, 0.32, 0.43]
     *
     * @since 7.0.0
     */
    cmyk(): number[];
    /**
     * Returns a CMYK color.
     *
     * @param options Options object.
     * @param options.format Format of generated CMYK color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.cmyk() // [0.31, 0.52, 0.32, 0.43]
     * faker.color.cmyk({ format: 'css' }) // cmyk(100%, 0%, 0%, 0%)
     * faker.color.cmyk({ format: 'binary' }) // (8-32 bits) x 4
     *
     * @since 7.0.0
     */
    cmyk(options?: {
      /**
       * Format of generated CMYK color.
       *
       * @default 'decimal'
       */
      format?: StringColorFormat;
    }): string;
    /**
     * Returns a CMYK color.
     *
     * @param options Options object.
     * @param options.format Format of generated CMYK color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.cmyk() // [0.31, 0.52, 0.32, 0.43]
     * faker.color.cmyk({ format: 'decimal' }) // [0.31, 0.52, 0.32, 0.43]
     *
     * @since 7.0.0
     */
    cmyk(options?: {
      /**
       * Format of generated CMYK color.
       *
       * @default 'decimal'
       */
      format?: NumberColorFormat;
    }): number[];
    /**
     * Returns a CMYK color.
     *
     * @param options Options object.
     * @param options.format Format of generated CMYK color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.cmyk() // [0.31, 0.52, 0.32, 0.43]
     * faker.color.cmyk({ format: 'decimal' }) // [0.31, 0.52, 0.32, 0.43]
     * faker.color.cmyk({ format: 'css' }) // cmyk(100%, 0%, 0%, 0%)
     * faker.color.cmyk({ format: 'binary' }) // (8-32 bits) x 4
     *
     * @since 7.0.0
     */
    cmyk(options?: {
      /**
       * Format of generated CMYK color.
       *
       * @default 'decimal'
       */
      format?: ColorFormat;
    }): string | number[];
    /**
     * Returns an HSL color.
     *
     * @example
     * faker.color.hsl() // [201, 0.23, 0.32]
     *
     * @since 7.0.0
     */
    hsl(): number[];
    /**
     * Returns an HSL color.
     *
     * @param options Options object.
     * @param options.format Format of generated HSL color. Defaults to \`'decimal'\`.
     * @param options.includeAlpha Adds an alpha value to the color (RGBA). Defaults to \`false\`.
     *
     * @example
     * faker.color.hsl() // [201, 0.23, 0.32]
     * faker.color.hsl({ format: 'css' }) // hsl(0deg, 100%, 80%)
     * faker.color.hsl({ format: 'css', includeAlpha: true }) // hsl(0deg 100% 50% / 0.5)
     * faker.color.hsl({ format: 'binary' }) // (8-32 bits) x 3
     * faker.color.hsl({ format: 'binary', includeAlpha: true }) // (8-32 bits) x 4
     *
     * @since 7.0.0
     */
    hsl(options?: {
      /**
       * Format of generated HSL color.
       *
       * @default 'decimal'
       */
      format?: StringColorFormat;
      /**
       * Adds an alpha value to the color (RGBA).
       *
       * @default false
       */
      includeAlpha?: boolean;
    }): string;
    /**
     * Returns an HSL color.
     *
     * @param options Options object.
     * @param options.format Format of generated HSL color. Defaults to \`'decimal'\`.
     * @param options.includeAlpha Adds an alpha value to the color (RGBA). Defaults to \`false\`.
     *
     * @example
     * faker.color.hsl() // [201, 0.23, 0.32]
     * faker.color.hsl({ format: 'decimal' }) // [300, 0.21, 0.52]
     * faker.color.hsl({ format: 'decimal', includeAlpha: true }) // [300, 0.21, 0.52, 0.28]
     *
     * @since 7.0.0
     */
    hsl(options?: {
      /**
       * Format of generated HSL color.
       *
       * @default 'decimal'
       */
      format?: NumberColorFormat;
      /**
       * Adds an alpha value to the color (RGBA).
       *
       * @default false
       */
      includeAlpha?: boolean;
    }): number[];
    /**
     * Returns an HSL color.
     *
     * @param options Options object.
     * @param options.format Format of generated HSL color. Defaults to \`'decimal'\`.
     * @param options.includeAlpha Adds an alpha value to the color (RGBA). Defaults to \`false\`.
     *
     * @example
     * faker.color.hsl() // [201, 0.23, 0.32]
     * faker.color.hsl({ format: 'decimal' }) // [300, 0.21, 0.52]
     * faker.color.hsl({ format: 'decimal', includeAlpha: true }) // [300, 0.21, 0.52, 0.28]
     * faker.color.hsl({ format: 'css' }) // hsl(0deg, 100%, 80%)
     * faker.color.hsl({ format: 'css', includeAlpha: true }) // hsl(0deg 100% 50% / 0.5)
     * faker.color.hsl({ format: 'binary' }) // (8-32 bits) x 3
     * faker.color.hsl({ format: 'binary', includeAlpha: true }) // (8-32 bits) x 4
     *
     * @since 7.0.0
     */
    hsl(options?: {
      /**
       * Format of generated HSL color.
       *
       * @default 'decimal'
       */
      format?: ColorFormat;
      /**
       * Adds an alpha value to the color (RGBA).
       *
       * @default false
       */
      includeAlpha?: boolean;
    }): string | number[];
    /**
     * Returns an HWB color.
     *
     * @example
     * faker.color.hwb() // [201, 0.21, 0.31]
     *
     * @since 7.0.0
     */
    hwb(): number[];
    /**
     * Returns an HWB color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.hwb() // [201, 0.21, 0.31]
     * faker.color.hwb({ format: 'css' }) // hwb(194 0% 0%)
     * faker.color.hwb({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    hwb(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: StringColorFormat;
    }): string;
    /**
     * Returns an HWB color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.hwb() // [201, 0.21, 0.31]
     * faker.color.hwb({ format: 'decimal' }) // [201, 0.21, 0.31]
     *
     * @since 7.0.0
     */
    hwb(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: NumberColorFormat;
    }): number[];
    /**
     * Returns an HWB color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.hwb() // [201, 0.21, 0.31]
     * faker.color.hwb({ format: 'decimal' }) // [201, 0.21, 0.31]
     * faker.color.hwb({ format: 'css' }) // hwb(194 0% 0%)
     * faker.color.hwb({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    hwb(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: ColorFormat;
    }): string | number[];
    /**
     * Returns a LAB (CIELAB) color.
     *
     * @example
     * faker.color.lab() // [0.832133, -80.3245, 100.1234]
     *
     * @since 7.0.0
     */
    lab(): number[];
    /**
     * Returns a LAB (CIELAB) color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.lab() // [0.832133, -80.3245, 100.1234]
     * faker.color.lab({ format: 'css' }) // lab(29.2345% 39.3825 20.0664)
     * faker.color.lab({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    lab(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: StringColorFormat;
    }): string;
    /**
     * Returns a LAB (CIELAB) color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.lab() // [0.832133, -80.3245, 100.1234]
     * faker.color.lab({ format: 'decimal' }) // [0.856773, -80.2345, 100.2341]
     *
     * @since 7.0.0
     */
    lab(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: NumberColorFormat;
    }): number[];
    /**
     * Returns a LAB (CIELAB) color.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.lab() // [0.832133, -80.3245, 100.1234]
     * faker.color.lab({ format: 'decimal' }) // [0.856773, -80.2345, 100.2341]
     * faker.color.lab({ format: 'css' }) // lab(29.2345% 39.3825 20.0664)
     * faker.color.lab({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    lab(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: ColorFormat;
    }): string | number[];
    /**
     * Returns an LCH color. Even though upper bound of
     * chroma in LCH color space is theoretically unbounded,
     * it is bounded to 230 as anything above will not
     * make a noticeable difference in the browser.
     *
     * @example
     * faker.color.lch() // [0.522345, 72.2, 56.2]
     *
     * @since 7.0.0
     */
    lch(): number[];
    /**
     * Returns an LCH color. Even though upper bound of
     * chroma in LCH color space is theoretically unbounded,
     * it is bounded to 230 as anything above will not
     * make a noticeable difference in the browser.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.lch() // [0.522345, 72.2, 56.2]
     * faker.color.lch({ format: 'css' }) // lch(52.2345% 72.2 56.2)
     * faker.color.lch({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    lch(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: StringColorFormat;
    }): string;
    /**
     * Returns an LCH color. Even though upper bound of
     * chroma in LCH color space is theoretically unbounded,
     * it is bounded to 230 as anything above will not
     * make a noticeable difference in the browser.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.lch() // [0.522345, 72.2, 56.2]
     * faker.color.lch({ format: 'decimal' }) // [0.522345, 72.2, 56.2]
     *
     * @since 7.0.0
     */
    lch(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: NumberColorFormat;
    }): number[];
    /**
     * Returns an LCH color. Even though upper bound of
     * chroma in LCH color space is theoretically unbounded,
     * it is bounded to 230 as anything above will not
     * make a noticeable difference in the browser.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     *
     * @example
     * faker.color.lch() // [0.522345, 72.2, 56.2]
     * faker.color.lch({ format: 'decimal' }) // [0.522345, 72.2, 56.2]
     * faker.color.lch({ format: 'css' }) // lch(52.2345% 72.2 56.2)
     * faker.color.lch({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    lch(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: ColorFormat;
    }): string | number[];
    /**
     * Returns a random color based on CSS color space specified.
     *
     * @example
     * faker.color.colorByCSSColorSpace() // [0.93, 1, 0.82]
     *
     * @since 7.0.0
     */
    colorByCSSColorSpace(): number[];
    /**
     * Returns a random color based on CSS color space specified.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     * @param options.space Color space to generate the color for. Defaults to \`'sRGB'\`.
     *
     * @example
     * faker.color.colorByCSSColorSpace() // [0.93, 1, 0.82]
     * faker.color.colorByCSSColorSpace({ format: 'css', space: 'display-p3' }) // color(display-p3 0.12 1 0.23)
     * faker.color.colorByCSSColorSpace({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    colorByCSSColorSpace(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: StringColorFormat;
      /**
       * Color space to generate the color for.
       *
       * @default 'sRGB'
       */
      space?: CssSpaceType;
    }): string;
    /**
     * Returns a random color based on CSS color space specified.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     * @param options.space Color space to generate the color for. Defaults to \`'sRGB'\`.
     *
     * @example
     * faker.color.colorByCSSColorSpace() // [0.93, 1, 0.82]
     * faker.color.colorByCSSColorSpace({ format: 'decimal' }) // [0.12, 0.21, 0.31]
     *
     * @since 7.0.0
     */
    colorByCSSColorSpace(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: NumberColorFormat;
      /**
       * Color space to generate the color for.
       *
       * @default 'sRGB'
       */
      space?: CssSpaceType;
    }): number[];
    /**
     * Returns a random color based on CSS color space specified.
     *
     * @param options Options object.
     * @param options.format Format of generated RGB color. Defaults to \`'decimal'\`.
     * @param options.space Color space to generate the color for. Defaults to \`'sRGB'\`.
     *
     * @example
     * faker.color.colorByCSSColorSpace() // [0.93, 1, 0.82]
     * faker.color.colorByCSSColorSpace({ format: 'decimal' }) // [0.12, 0.21, 0.31]
     * faker.color.colorByCSSColorSpace({ format: 'css', space: 'display-p3' }) // color(display-p3 0.12 1 0.23)
     * faker.color.colorByCSSColorSpace({ format: 'binary' }) // (8-32 bits x 3)
     *
     * @since 7.0.0
     */
    colorByCSSColorSpace(options?: {
      /**
       * Format of generated RGB color.
       *
       * @default 'decimal'
       */
      format?: ColorFormat;
      /**
       * Color space to generate the color for.
       *
       * @default 'sRGB'
       */
      space?: CssSpaceType;
    }): string | number[];
  }
  declare class CommerceModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a department inside a shop.
     *
     * @example
     * faker.commerce.department() // 'Garden'
     *
     * @since 3.0.0
     */
    department(): string;
    /**
     * Generates a random descriptive product name.
     *
     * @example
     * faker.commerce.productName() // 'Incredible Soft Gloves'
     *
     * @since 3.0.0
     */
    productName(): string;
    /**
     * Generates a price between min and max (inclusive).
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.min The minimum price. Defaults to \`1\`.
     * @param options.max The maximum price. Defaults to \`1000\`.
     * @param options.dec The number of decimal places. Defaults to \`2\`.
     * @param options.symbol The currency value to use. Defaults to \`''\`.
     *
     * @example
     * faker.commerce.price() // 828.00
     * faker.commerce.price({ min: 100 }) // 904.00
     * faker.commerce.price({ min: 100, max: 200 }) // 154.00
     * faker.commerce.price({ min: 100, max: 200, dec: 0 }) // 133
     * faker.commerce.price({ min: 100, max: 200, dec: 0, symbol: '$' }) // $114
     *
     * @since 3.0.0
     */
    price(options?: {
      /**
       * The minimum price.
       *
       * @default 1
       */
      min?: number;
      /**
       * The maximum price.
       *
       * @default 1000
       */
      max?: number;
      /**
       * The number of decimal places.
       *
       * @default 2
       */
      dec?: number;
      /**
       * The currency value to use.
       *
       * @default ''
       */
      symbol?: string;
    }): string;
    /**
     * Generates a price between min and max (inclusive).
     *
     * @param min The minimum price. Defaults to \`1\`.
     * @param max The maximum price. Defaults to \`1000\`.
     * @param dec The number of decimal places. Defaults to \`2\`.
     * @param symbol The currency value to use. Defaults to \`''\`.
     *
     * @example
     * faker.commerce.price() // 828.00
     * faker.commerce.price(100) // 904.00
     * faker.commerce.price(100, 200) // 154.00
     * faker.commerce.price(100, 200, 0) // 133
     * faker.commerce.price(100, 200, 0, '$') // $114
     *
     * @since 3.0.0
     *
     * @deprecated Use \`faker.commerce.price({ min, max, dec, symbol })\` instead.
     */
    price(min?: number, max?: number, dec?: number, symbol?: string): string;
    /**
     * Generates a price between min and max (inclusive).
     *
     * @param options The minimum price or on options object. Defaults to \`{}\`.
     * @param options.min The minimum price. Defaults to \`1\`.
     * @param options.max The maximum price. Defaults to \`1000\`.
     * @param options.dec The number of decimal places. Defaults to \`2\`.
     * @param options.symbol The currency value to use. Defaults to \`''\`.
     * @param legacyMax The maximum price. This argument is deprecated. Defaults to \`1000\`.
     * @param legacyDec The number of decimal places. This argument is deprecated. Defaults to \`2\`.
     * @param legacySymbol The currency value to use. This argument is deprecated. Defaults to \`''\`.
     *
     * @example
     * faker.commerce.price() // 828.00
     * faker.commerce.price({ min: 100 }) // 904.00
     * faker.commerce.price({ min: 100, max: 200 }) // 154.00
     * faker.commerce.price({ min: 100, max: 200, dec: 0 }) // 133
     * faker.commerce.price({ min: 100, max: 200, dec: 0, symbol: '$' }) // $114
     *
     * @since 3.0.0
     */
    price(options?: number | {
      min?: number;
      max?: number;
      dec?: number;
      symbol?: string;
    }, legacyMax?: number, legacyDec?: number, legacySymbol?: string): string;
    /**
     * Returns an adjective describing a product.
     *
     * @example
     * faker.commerce.productAdjective() // 'Handcrafted'
     *
     * @since 3.0.0
     */
    productAdjective(): string;
    /**
     * Returns a material of a product.
     *
     * @example
     * faker.commerce.productMaterial() // 'Rubber'
     *
     * @since 3.0.0
     */
    productMaterial(): string;
    /**
     * Returns a short product name.
     *
     * @example
     * faker.commerce.product() // 'Computer'
     *
     * @since 3.0.0
     */
    product(): string;
    /**
     * Returns a product description.
     *
     * @example
     * faker.commerce.productDescription() // 'Andy shoes are designed to keeping...'
     *
     * @since 5.0.0
     */
    productDescription(): string;
  }
  declare class CompanyModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns an array with possible company name suffixes.
     *
     * @see faker.company.name()
     *
     * @example
     * faker.company.suffixes() // [ 'Inc', 'and Sons', 'LLC', 'Group' ]
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.company.name\` instead.
     */
    suffixes(): string[];
    /**
     * Generates a random company name.
     *
     * @example
     * faker.company.name() // 'Zieme, Hauck and McClure'
     *
     * @since 7.4.0
     */
    name(): string;
    /**
     * Returns a random company suffix.
     *
     * @see faker.company.name()
     *
     * @example
     * faker.company.companySuffix() // 'and Sons'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.company.name\` instead.
     */
    companySuffix(): string;
    /**
     * Generates a random catch phrase that can be displayed to an end user.
     *
     * @example
     * faker.company.catchPhrase() // 'Upgradable systematic flexibility'
     *
     * @since 2.0.1
     */
    catchPhrase(): string;
    /**
     * Generates a random company bs phrase.
     *
     * @example
     * faker.company.bs() // 'cultivate synergistic e-markets'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.company.buzzPhrase\` instead.
     */
    bs(): string;
    /**
     * Generates a random buzz phrase that can be used to demonstrate data being viewed by a manager.
     *
     * @example
     * faker.company.buzzPhrase() // 'cultivate synergistic e-markets'
     *
     * @since 8.0.0
     */
    buzzPhrase(): string;
    /**
     * Returns a random catch phrase adjective that can be displayed to an end user..
     *
     * @example
     * faker.company.catchPhraseAdjective() // 'Multi-tiered'
     *
     * @since 2.0.1
     */
    catchPhraseAdjective(): string;
    /**
     * Returns a random catch phrase descriptor that can be displayed to an end user..
     *
     * @example
     * faker.company.catchPhraseDescriptor() // 'composite'
     *
     * @since 2.0.1
     */
    catchPhraseDescriptor(): string;
    /**
     * Returns a random catch phrase noun that can be displayed to an end user..
     *
     * @example
     * faker.company.catchPhraseNoun() // 'leverage'
     *
     * @since 2.0.1
     */
    catchPhraseNoun(): string;
    /**
     * Returns a random company bs adjective.
     *
     * @example
     * faker.company.bsAdjective() // 'one-to-one'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.company.buzzAdjective\` instead.
     */
    bsAdjective(): string;
    /**
     * Returns a random buzz adjective that can be used to demonstrate data being viewed by a manager.
     *
     * @example
     * faker.company.buzzAdjective() // 'one-to-one'
     *
     * @since 8.0.0
     */
    buzzAdjective(): string;
    /**
     * Returns a random company bs buzz word.
     *
     * @example
     * faker.company.bsBuzz() // 'empower'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.company.buzzVerb\` instead.
     */
    bsBuzz(): string;
    /**
     * Returns a random buzz verb that can be used to demonstrate data being viewed by a manager.
     *
     * @example
     * faker.company.buzzVerb() // 'empower'
     *
     * @since 8.0.0
     */
    buzzVerb(): string;
    /**
     * Returns a random company bs noun.
     *
     * @example
     * faker.company.bsNoun() // 'paradigms'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.company.buzzNoun\` instead.
     */
    bsNoun(): string;
    /**
     * Returns a random buzz noun that can be used to demonstrate data being viewed by a manager.
     *
     * @example
     * faker.company.buzzNoun() // 'paradigms'
     *
     * @since 8.0.0
     */
    buzzNoun(): string;
  }
  declare class DatabaseModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random database column name.
     *
     * @example
     * faker.database.column() // 'createdAt'
     *
     * @since 4.0.0
     */
    column(): string;
    /**
     * Returns a random database column type.
     *
     * @example
     * faker.database.type() // 'timestamp'
     *
     * @since 4.0.0
     */
    type(): string;
    /**
     * Returns a random database collation.
     *
     * @example
     * faker.database.collation() // 'utf8_unicode_ci'
     *
     * @since 4.0.0
     */
    collation(): string;
    /**
     * Returns a random database engine.
     *
     * @example
     * faker.database.engine() // 'ARCHIVE'
     *
     * @since 4.0.0
     */
    engine(): string;
    /**
     * Returns a MongoDB [ObjectId](https://docs.mongodb.com/manual/reference/method/ObjectId/) string.
     *
     * @example
     * faker.database.mongodbObjectId() // 'e175cac316a79afdd0ad3afb'
     *
     * @since 6.2.0
     */
    mongodbObjectId(): string;
  }
  declare class DatatypeModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a single random number between zero and the given max value or the given range with the specified precision.
     * The bounds are inclusive.
     *
     * @param options Maximum value or options object.
     * @param options.min Lower bound for generated number. Defaults to \`0\`.
     * @param options.max Upper bound for generated number. Defaults to \`min + 99999\`.
     * @param options.precision Precision of the generated number. Defaults to \`1\`.
     *
     * @throws When options define \`max < min\`.
     *
     * @see faker.number.int() for the default precision of \`1\`
     * @see faker.number.float() for a custom precision
     *
     * @example
     * faker.datatype.number() // 55422
     * faker.datatype.number(100) // 52
     * faker.datatype.number({ min: 1000000 }) // 1031433
     * faker.datatype.number({ max: 100 }) // 42
     * faker.datatype.number({ precision: 0.01 }) // 64246.18
     * faker.datatype.number({ min: 10, max: 100, precision: 0.01 }) // 36.94
     *
     * @since 5.5.0
     *
     * @deprecated Use \`faker.number.int()\` or \`faker.number.float()\` instead.
     */
    number(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default min + 99999
       */
      max?: number;
      /**
       * Precision of the generated number.
       *
       * @default 1
       */
      precision?: number;
    }): number;
    /**
     * Returns a single random floating-point number for the given precision or range and precision.
     *
     * @param options Precision or options object.
     * @param options.min Lower bound for generated number. Defaults to \`0\`.
     * @param options.max Upper bound for generated number. Defaults to \`min + 99999\`.
     * @param options.precision Precision of the generated number. Defaults to \`0.01\`.
     *
     * @see faker.number.float()
     *
     * @example
     * faker.datatype.float() // 51696.36
     * faker.datatype.float(0.1) // 52023.2
     * faker.datatype.float({ min: 1000000 }) // 212859.76
     * faker.datatype.float({ max: 100 }) // 28.11
     * faker.datatype.float({ precision: 0.1 }) // 84055.3
     * faker.datatype.float({ min: 10, max: 100, precision: 0.001 }) // 57.315
     *
     * @since 5.5.0
     *
     * @deprecated Use \`faker.number.float()\` instead.
     */
    float(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default min + 99999
       */
      max?: number;
      /**
       * Precision of the generated number.
       *
       * @default 0.01
       */
      precision?: number;
    }): number;
    /**
     * Returns a Date object using a random number of milliseconds since
     * the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time) (1 January 1970 UTC).
     *
     * @param options Max number of milliseconds since unix epoch or options object.
     * @param options.min Lower bound for milliseconds since base date.
     *    When not provided or smaller than \`-8640000000000000\`, \`1990-01-01\` is considered
     *    as minimum generated date. Defaults to \`631152000000\`.
     * @param options.max Upper bound for milliseconds since base date.
     *    When not provided or larger than \`8640000000000000\`, \`2100-01-01\` is considered
     *    as maximum generated date. Defaults to \`4102444800000\`.
     *
     * @see faker.date.anytime()
     * @see faker.date.between()
     *
     * @example
     * faker.datatype.datetime() // '2089-04-17T18:03:24.956Z'
     * faker.datatype.datetime(1893456000000) // '2022-03-28T07:00:56.876Z'
     * faker.datatype.datetime({ min: 1577836800000, max: 1893456000000 }) // '2021-09-12T07:13:00.255Z'
     *
     * @since 5.5.0
     *
     * @deprecated Use \`faker.date.between({ from: min, to: max })\` or \`faker.date.anytime()\` instead.
     */
    datetime(options?: number | {
      /**
       * Lower bound for milliseconds since base date.
       *
       * When not provided or smaller than \`-8640000000000000\`, \`1990-01-01\` is considered as minimum generated date.
       *
       * @default 631152000000
       */
      min?: number;
      /**
       * Upper bound for milliseconds since base date.
       *
       * When not provided or larger than \`8640000000000000\`, \`2100-01-01\` is considered as maximum generated date.
       *
       * @default 4102444800000
       */
      max?: number;
    }): Date;
    /**
     * Returns a string containing UTF-16 chars between 33 and 125 (\`!\` to \`}\`).
     *
     * @param options Length of the generated string or an options object. Defaults to \`{}\`.
     * @param options.length Length of the generated string. Max length is \`2^20\`. Defaults to \`10\`.
     *
     * @see faker.string.sample()
     *
     * @example
     * faker.datatype.string() // 'Zo!.:*e>wR'
     * faker.datatype.string(5) // '6Bye8'
     * faker.datatype.string({ length: 7 }) // 'dzOT00e'
     *
     * @since 5.5.0
     *
     * @deprecated Use \`faker.string.sample()\` instead.
     */
    string(options?: number | {
      /**
       * Length of the generated string. Max length is \`2^20\`.
       *
       * @default 10
       */
      length?: number;
    }): string;
    /**
     * Returns a UUID v4 ([Universally Unique Identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier)).
     *
     * @see faker.string.uuid()
     *
     * @example
     * faker.datatype.uuid() // '4136cd0b-d90b-4af7-b485-5d1ded8db252'
     *
     * @since 5.5.0
     *
     * @deprecated Use \`faker.string.uuid()\` instead.
     */
    uuid(): string;
    /**
     * Returns the boolean value true or false.
     *
     * **Note:**
     * A probability of \`0.75\` results in \`true\` being returned \`75%\` of the calls; likewise \`0.3\` => \`30%\`.
     * If the probability is \`<= 0.0\`, it will always return \`false\`.
     * If the probability is \`>= 1.0\`, it will always return \`true\`.
     * The probability is limited to two decimal places.
     *
     * @param options The optional options object or the probability (\`[0.00, 1.00]\`) of returning \`true\`. Defaults to \`0.5\`.
     * @param options.probability The probability (\`[0.00, 1.00]\`) of returning \`true\`. Defaults to \`0.5\`.
     *
     * @example
     * faker.datatype.boolean() // false
     * faker.datatype.boolean(0.9) // true
     * faker.datatype.boolean({ probability: 0.1 }) // false
     *
     * @since 5.5.0
     */
    boolean(options?: number | {
      /**
       * The probability (\`[0.00, 1.00]\`) of returning \`true\`.
       *
       * @default 0.5
       */
      probability?: number;
    }): boolean;
    /**
     * Returns a [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) number.
     *
     * @param options The optional options object.
     * @param options.length Length of the generated number. Defaults to \`1\`.
     * @param options.prefix Prefix for the generated number. Defaults to \`'0x'\`.
     * @param options.case Case of the generated number. Defaults to \`'mixed'\`.
     *
     * @see faker.string.hexadecimal()
     *
     * @example
     * faker.datatype.hexadecimal() // '0xB'
     * faker.datatype.hexadecimal({ length: 10 }) // '0xaE13d044cB'
     * faker.datatype.hexadecimal({ prefix: '0x' }) // '0xE'
     * faker.datatype.hexadecimal({ case: 'lower' }) // '0xf'
     * faker.datatype.hexadecimal({ length: 10, prefix: '#' }) // '#f12a974eB1'
     * faker.datatype.hexadecimal({ length: 10, case: 'upper' }) // '0xE3F38014FB'
     * faker.datatype.hexadecimal({ prefix: '', case: 'lower' }) // 'd'
     * faker.datatype.hexadecimal({ length: 10, prefix: '0x', case: 'mixed' }) // '0xAdE330a4D1'
     *
     * @since 6.1.2
     *
     * @deprecated Use \`faker.string.hexadecimal()\` or \`faker.number.hex()\` instead.
     */
    hexadecimal(options?: {
      /**
       * Length of the generated number.
       *
       * @default 1
       */
      length?: number;
      /**
       * Prefix for the generated number.
       *
       * @default '0x'
       */
      prefix?: string;
      /**
       * Case of the generated number.
       *
       * @default 'mixed'
       */
      case?: "lower" | "upper" | "mixed";
    }): string;
    /**
     * Returns a string representing JSON object with 7 pre-defined properties.
     *
     * @example
     * faker.datatype.json() // \`{"foo":"mxz.v8ISij","bar":29154,"bike":8658,"a":"GxTlw$nuC:","b":40693,"name":"%'<FTou{7X","prop":"X(bd4iT>77"}\`
     *
     * @since 5.5.0
     *
     * @deprecated Build your own function to generate complex objects.
     */
    json(): string;
    /**
     * Returns an array with random strings and numbers.
     *
     * @param length Size of the returned array. Defaults to \`10\`.
     * @param length.min The minimum size of the array.
     * @param length.max The maximum size of the array.
     *
     * @example
     * faker.datatype.array() // [ 94099, 85352, 'Hz%T.C\\l;8', '|#gmtw3otS', '2>:rJ|3$&d', 56864, 'Ss2-p0RXSI', 51084, 2039, 'mNEU[.r0Vf' ]
     * faker.datatype.array(3) // [ 61845, 'SK7H$W3:d*', 'm[%7N8*GVK' ]
     * faker.datatype.array({ min: 3, max: 5 }) // [ 99403, 76924, 42281, "Q'|$&y\\G/9" ]
     *
     * @since 5.5.0
     *
     * @deprecated Use your own function to build complex arrays.
     */
    array(length?: number | {
      /**
       * The minimum size of the array.
       */
      min: number;
      /**
       * The maximum size of the array.
       */
      max: number;
    }): Array<string | number>;
    /**
     * Returns a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type) number.
     *
     * @param options Maximum value or options object.
     * @param options.min Lower bound for generated bigint. Defaults to \`0n\`.
     * @param options.max Upper bound for generated bigint. Defaults to \`min + 999999999999999n\`.
     *
     * @throws When options define \`max < min\`.
     *
     * @see faker.number.bigInt()
     *
     * @example
     * faker.datatype.bigInt() // 55422n
     * faker.datatype.bigInt(100n) // 52n
     * faker.datatype.bigInt({ min: 1000000n }) // 431433n
     * faker.datatype.bigInt({ max: 100n }) // 42n
     * faker.datatype.bigInt({ min: 10n, max: 100n }) // 36n
     *
     * @since 6.0.0
     *
     * @deprecated Use \`faker.number.bigInt()\` instead.
     */
    bigInt(options?: bigint | boolean | number | string | {
      /**
       * Lower bound for generated bigint.
       *
       * @default 0n
       */
      min?: bigint | boolean | number | string;
      /**
       * Upper bound for generated bigint.
       *
       * @default min + 999999999999999n
       */
      max?: bigint | boolean | number | string;
    }): bigint;
  }
  declare class DateModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a random date that can be either in the past or in the future.
     *
     * @param options The optional options object.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.between() For dates in a specific range.
     * @see faker.date.past() For dates explicitly in the past.
     * @see faker.date.future() For dates explicitly in the future.
     *
     * @example
     * faker.date.anytime() // '2022-07-31T01:33:29.567Z'
     *
     * @since 8.0.0
     */
    anytime(options?: {
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): Date;
    /**
     * Generates a random date in the past.
     *
     * @param options The optional options object.
     * @param options.years The range of years the date may be in the past. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.recent()
     *
     * @example
     * faker.date.past() // '2021-12-03T05:40:44.408Z'
     * faker.date.past({ years: 10 }) // '2017-10-25T21:34:19.488Z'
     * faker.date.past({ years: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2017-08-18T02:59:12.350Z'
     *
     * @since 8.0.0
     */
    past(options?: {
      /**
       * The range of years the date may be in the past.
       *
       * @default 1
       */
      years?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): Date;
    /**
     * Generates a random date in the past.
     *
     * @param years The range of years the date may be in the past. Defaults to \`1\`.
     * @param refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.recent()
     *
     * @example
     * faker.date.past() // '2021-12-03T05:40:44.408Z'
     * faker.date.past(10) // '2017-10-25T21:34:19.488Z'
     * faker.date.past(10, '2020-01-01T00:00:00.000Z') // '2017-08-18T02:59:12.350Z'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.date.past({ years, refDate })\` instead.
     */
    past(years?: number, refDate?: string | Date | number): Date;
    /**
     * Generates a random date in the past.
     *
     * @param options The optional options object.
     * @param options.years The range of years the date may be in the past. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     * @param legacyRefDate Deprecated, use \`options.refDate\` instead.
     *
     * @see faker.date.recent()
     *
     * @example
     * faker.date.past() // '2021-12-03T05:40:44.408Z'
     * faker.date.past({ years: 10 }) // '2017-10-25T21:34:19.488Z'
     * faker.date.past({ years: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2017-08-18T02:59:12.350Z'
     *
     * @since 8.0.0
     */
    past(options?: number | {
      /**
       * The range of years the date may be in the past.
       *
       * @default 1
       */
      years?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }, legacyRefDate?: string | Date | number): Date;
    /**
     * Generates a random date in the future.
     *
     * @param options The optional options object.
     * @param options.years The range of years the date may be in the future. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.soon()
     *
     * @example
     * faker.date.future() // '2022-11-19T05:52:49.100Z'
     * faker.date.future({ years: 10 }) // '2030-11-23T09:38:28.710Z'
     * faker.date.future({ years: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2020-12-13T22:45:10.252Z'
     *
     * @since 8.0.0
     */
    future(options?: {
      /**
       * The range of years the date may be in the future.
       *
       * @default 1
       */
      years?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): Date;
    /**
     * Generates a random date in the future.
     *
     * @param years The range of years the date may be in the future. Defaults to \`1\`.
     * @param refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.soon()
     *
     * @example
     * faker.date.future() // '2022-11-19T05:52:49.100Z'
     * faker.date.future(10) // '2030-11-23T09:38:28.710Z'
     * faker.date.future(10, '2020-01-01T00:00:00.000Z') // '2020-12-13T22:45:10.252Z'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.date.future({ years, refDate })\` instead.
     */
    future(years?: number, refDate?: string | Date | number): Date;
    /**
     * Generates a random date in the future.
     *
     * @param options The optional options object.
     * @param options.years The range of years the date may be in the future. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     * @param legacyRefDate Deprecated, use \`options.refDate\` instead.
     *
     * @see faker.date.soon()
     *
     * @example
     * faker.date.future() // '2022-11-19T05:52:49.100Z'
     * faker.date.future({ years: 10 }) // '2030-11-23T09:38:28.710Z'
     * faker.date.future({ years: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2020-12-13T22:45:10.252Z'
     *
     * @since 8.0.0
     */
    future(options?: number | {
      /**
       * The range of years the date may be in the future.
       *
       * @default 1
       */
      years?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }, legacyRefDate?: string | Date | number): Date;
    /**
     * Generates a random date between the given boundaries.
     *
     * @param options The optional options object.
     * @param options.from The early date boundary.
     * @param options.to The late date boundary.
     *
     * @example
     * faker.date.between({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z' }) // '2026-05-16T02:22:53.002Z'
     *
     * @since 8.0.0
     */
    between(options: {
      /**
       * The early date boundary.
       */
      from: string | Date | number;
      /**
       * The late date boundary.
       */
      to: string | Date | number;
    }): Date;
    /**
     * Generates a random date between the given boundaries.
     *
     * @param from The early date boundary.
     * @param to The late date boundary.
     *
     * @example
     * faker.date.between('2020-01-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z') // '2026-05-16T02:22:53.002Z'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.date.between({ from, to })\` instead.
     */
    between(from: string | Date | number, to: string | Date | number): Date;
    /**
     * Generates a random date between the given boundaries.
     *
     * @param options The optional options object.
     * @param options.from The early date boundary.
     * @param options.to The late date boundary.
     * @param legacyTo Deprecated, use \`options.to\` instead.
     *
     * @example
     * faker.date.between({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z' }) // '2026-05-16T02:22:53.002Z'
     *
     * @since 8.0.0
     */
    between(options: string | Date | number | {
      /**
       * The early date boundary.
       */
      from: string | Date | number;
      /**
       * The late date boundary.
       */
      to: string | Date | number;
    }, legacyTo?: string | Date | number): Date;
    /**
     * Generates random dates between the given boundaries.
     *
     * @param options The optional options object.
     * @param options.from The early date boundary.
     * @param options.to The late date boundary.
     * @param options.count The number of dates to generate. Defaults to \`3\`.
     *
     * @example
     * faker.date.betweens({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z' })
     * // [
     * //   2022-07-02T06:00:00.000Z,
     * //   2024-12-31T12:00:00.000Z,
     * //   2027-07-02T18:00:00.000Z
     * // ]
     * faker.date.betweens({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z', count: 2 })
     * // [ 2023-05-02T16:00:00.000Z, 2026-09-01T08:00:00.000Z ]
     * faker.date.betweens({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z', count: { min: 2, max: 5 }})
     * // [
     * //   2021-12-19T06:35:40.191Z,
     * //   2022-09-10T08:03:51.351Z,
     * //   2023-04-19T11:41:17.501Z
     * // ]
     *
     * @since 8.0.0
     */
    betweens(options: {
      /**
       * The early date boundary.
       */
      from: string | Date | number;
      /**
       * The late date boundary.
       */
      to: string | Date | number;
      /**
       * The number of dates to generate.
       *
       * @default 3
       */
      count?: number | {
        /**
         * The minimum number of dates to generate.
         */
        min: number;
        /**
         * The maximum number of dates to generate.
         */
        max: number;
      };
    }): Date[];
    /**
     * Generates random dates between the given boundaries.
     *
     * @param from The early date boundary.
     * @param to The late date boundary.
     * @param count The number of dates to generate. Defaults to \`3\`.
     * @param count.min The minimum number of dates to generate.
     * @param count.max The maximum number of dates to generate.
     *
     * @example
     * faker.date.betweens('2020-01-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z')
     * // [
     * //   2022-07-02T06:00:00.000Z,
     * //   2024-12-31T12:00:00.000Z,
     * //   2027-07-02T18:00:00.000Z
     * // ]
     * faker.date.betweens('2020-01-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z', 2)
     * // [ 2023-05-02T16:00:00.000Z, 2026-09-01T08:00:00.000Z ]
     *
     * @since 5.4.0
     *
     * @deprecated Use \`faker.date.betweens({ from, to, count })\` instead.
     */
    betweens(from: string | Date | number, to: string | Date | number, count?: number): Date[];
    /**
     * Generates random dates between the given boundaries.
     *
     * @param options The optional options object.
     * @param options.from The early date boundary.
     * @param options.to The late date boundary.
     * @param options.count The number of dates to generate. Defaults to \`3\`.
     * @param legacyTo Deprecated, use \`options.to\` instead.
     * @param legacyCount Deprecated, use \`options.count\` instead.
     *
     * @example
     * faker.date.betweens({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z' })
     * // [
     * //   2022-07-02T06:00:00.000Z,
     * //   2024-12-31T12:00:00.000Z,
     * //   2027-07-02T18:00:00.000Z
     * // ]
     * faker.date.betweens({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z', count: 2 })
     * // [ 2023-05-02T16:00:00.000Z, 2026-09-01T08:00:00.000Z ]
     * faker.date.betweens({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z', count: { min: 2, max: 5 }})
     * // [
     * //   2021-12-19T06:35:40.191Z,
     * //   2022-09-10T08:03:51.351Z,
     * //   2023-04-19T11:41:17.501Z
     * // ]
     *
     * @since 8.0.0
     */
    betweens(options: string | Date | number | {
      /**
       * The early date boundary.
       */
      from: string | Date | number;
      /**
       * The late date boundary.
       */
      to: string | Date | number;
      /**
       * The number of dates to generate.
       *
       * @default 3
       */
      count?: number | {
        /**
         * The minimum number of dates to generate.
         */
        min: number;
        /**
         * The maximum number of dates to generate.
         */
        max: number;
      };
    }, legacyTo?: string | Date | number, legacyCount?: number): Date[];
    /**
     * Generates a random date in the recent past.
     *
     * @param options The optional options object.
     * @param options.days The range of days the date may be in the past. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.past()
     *
     * @example
     * faker.date.recent() // '2022-02-04T02:09:35.077Z'
     * faker.date.recent({ days: 10 }) // '2022-01-29T06:12:12.829Z'
     * faker.date.recent({ days: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2019-12-27T18:11:19.117Z'
     *
     * @since 8.0.0
     */
    recent(options?: {
      /**
       * The range of days the date may be in the past.
       *
       * @default 1
       */
      days?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): Date;
    /**
     * Generates a random date in the recent past.
     *
     * @param days The range of days the date may be in the past. Defaults to \`1\`.
     * @param refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.past()
     *
     * @example
     * faker.date.recent() // '2022-02-04T02:09:35.077Z'
     * faker.date.recent(10) // '2022-01-29T06:12:12.829Z'
     * faker.date.recent(10, '2020-01-01T00:00:00.000Z') // '2019-12-27T18:11:19.117Z'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.date.recent({ days, refDate })\` instead.
     */
    recent(days?: number, refDate?: string | Date | number): Date;
    /**
     * Generates a random date in the recent past.
     *
     * @param options The optional options object.
     * @param options.days The range of days the date may be in the past. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     * @param legacyRefDate Deprecated, use \`options.refDate\` instead.
     *
     * @see faker.date.past()
     *
     * @example
     * faker.date.recent() // '2022-02-04T02:09:35.077Z'
     * faker.date.recent({ days: 10 }) // '2022-01-29T06:12:12.829Z'
     * faker.date.recent({ days: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2019-12-27T18:11:19.117Z'
     *
     * @since 8.0.0
     */
    recent(options?: number | {
      /**
       * The range of days the date may be in the past.
       *
       * @default 1
       */
      days?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }, legacyRefDate?: string | Date | number): Date;
    /**
     * Generates a random date in the near future.
     *
     * @param options The optional options object.
     * @param options.days The range of days the date may be in the future. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.future()
     *
     * @example
     * faker.date.soon() // '2022-02-05T09:55:39.216Z'
     * faker.date.soon({ days: 10 }) // '2022-02-11T05:14:39.138Z'
     * faker.date.soon({ days: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2020-01-01T02:40:44.990Z'
     *
     * @since 8.0.0
     */
    soon(options?: {
      /**
       * The range of days the date may be in the future.
       *
       * @default 1
       */
      days?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): Date;
    /**
     * Generates a random date in the near future.
     *
     * @param days The range of days the date may be in the future. Defaults to \`1\`.
     * @param refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     *
     * @see faker.date.future()
     *
     * @example
     * faker.date.soon() // '2022-02-05T09:55:39.216Z'
     * faker.date.soon(10) // '2022-02-11T05:14:39.138Z'
     * faker.date.soon(10, '2020-01-01T00:00:00.000Z') // '2020-01-01T02:40:44.990Z'
     *
     * @since 5.0.0
     *
     * @deprecated Use \`faker.date.soon({ days, refDate })\` instead.
     */
    soon(days?: number, refDate?: string | Date | number): Date;
    /**
     * Generates a random date in the near future.
     *
     * @param options The optional options object.
     * @param options.days The range of days the date may be in the future. Defaults to \`1\`.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`faker.defaultRefDate()\`.
     * @param legacyRefDate Deprecated, use \`options.refDate\` instead.
     *
     * @see faker.date.future()
     *
     * @example
     * faker.date.soon() // '2022-02-05T09:55:39.216Z'
     * faker.date.soon({ days: 10 }) // '2022-02-11T05:14:39.138Z'
     * faker.date.soon({ days: 10, refDate: '2020-01-01T00:00:00.000Z' }) // '2020-01-01T02:40:44.990Z'
     *
     * @since 8.0.0
     */
    soon(options?: number | {
      /**
       * The range of days the date may be in the future.
       *
       * @default 1
       */
      days?: number;
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }, legacyRefDate?: string | Date | number): Date;
    /**
     * Returns a random name of a month.
     *
     * @param options The optional options to use.
     * @param options.abbreviated Whether to return an abbreviation. Defaults to \`false\`.
     * @param options.context Whether to return the name of a month in the context of a date. In the default \`en\` locale this has no effect, however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization, for example \`'январь'\` with \`{ context: false }\` and \`'января'\` with \`{ context: true }\` in \`ru\`. Defaults to \`false\`.
     *
     * @example
     * faker.date.month() // 'October'
     * faker.date.month({ abbreviated: true }) // 'Feb'
     * faker.date.month({ context: true }) // 'June'
     * faker.date.month({ abbreviated: true, context: true }) // 'Sep'
     *
     * @since 3.0.1
     */
    month(options?: {
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       */
      abbreviated?: boolean;
      /**
       * Whether to return the name of a month in the context of a date.
       *
       * In the default \`en\` locale this has no effect,
       * however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization,
       * for example \`'январь'\` with \`{ context: false }\` and \`'января'\` with \`{ context: true }\` in \`ru\`.
       *
       * @default false
       */
      context?: boolean;
    }): string;
    /**
     * Returns a random name of a month.
     *
     * @param options The optional options to use.
     * @param options.abbr Deprecated, use \`abbreviated\` instead.
     * @param options.context Whether to return the name of a month in the context of a date. In the default \`en\` locale this has no effect, however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization, for example \`'январь'\` with \`{ context: false }\` and \`'января'\` with \`{ context: true }\` in \`ru\`. Defaults to \`false\`.
     *
     * @example
     * faker.date.month() // 'October'
     * faker.date.month({ abbr: true }) // 'Feb'
     * faker.date.month({ context: true }) // 'June'
     * faker.date.month({ abbr: true, context: true }) // 'Sep'
     *
     * @since 3.0.1
     *
     * @deprecated Use \`faker.date.month({ abbreviated, ... })\` instead.
     */
    month(options?: {
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       *
       * @deprecated Use \`abbreviated\` instead.
       */
      abbr?: boolean;
      /**
       * Whether to return the name of a month in the context of a date.
       *
       * In the default \`en\` locale this has no effect,
       * however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization,
       * for example \`'январь'\` with \`{ context: false }\` and \`'января'\` with \`{ context: true }\` in \`ru\`.
       *
       * @default false
       */
      context?: boolean;
    }): string;
    /**
     * Returns a random name of a month.
     *
     * @param options The optional options to use.
     * @param options.abbr Deprecated, use \`abbreviated\` instead.
     * @param options.abbreviated Whether to return an abbreviation. Defaults to \`false\`.
     * @param options.context Whether to return the name of a month in the context of a date. In the default \`en\` locale this has no effect, however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization, for example \`'январь'\` with \`{ context: false }\` and \`'января'\` with \`{ context: true }\` in \`ru\`. Defaults to \`false\`.
     *
     * @example
     * faker.date.month() // 'October'
     * faker.date.month({ abbreviated: true }) // 'Feb'
     * faker.date.month({ context: true }) // 'June'
     * faker.date.month({ abbreviated: true, context: true }) // 'Sep'
     *
     * @since 3.0.1
     */
    month(options?: {
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       *
       * @deprecated Use \`abbreviated\` instead.
       */
      abbr?: boolean;
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       */
      abbreviated?: boolean;
      /**
       * Whether to return the name of a month in the context of a date.
       *
       * In the default \`en\` locale this has no effect,
       * however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization,
       * for example \`'январь'\` with \`{ context: false }\` and \`'января'\` with \`{ context: true }\` in \`ru\`.
       *
       * @default false
       */
      context?: boolean;
    }): string;
    /**
     * Returns a random day of the week.
     *
     * @param options The optional options to use.
     * @param options.abbreviated Whether to return an abbreviation. Defaults to \`false\`.
     * @param options.context Whether to return the day of the week in the context of a date. In the default \`en\` locale this has no effect, however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization, for example \`'Lundi'\` with \`{ context: false }\` and \`'lundi'\` with \`{ context: true }\` in \`fr\`. Defaults to \`false\`.
     *
     * @example
     * faker.date.weekday() // 'Monday'
     * faker.date.weekday({ abbreviated: true }) // 'Thu'
     * faker.date.weekday({ context: true }) // 'Thursday'
     * faker.date.weekday({ abbreviated: true, context: true }) // 'Fri'
     *
     * @since 3.0.1
     */
    weekday(options?: {
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       */
      abbreviated?: boolean;
      /**
       * Whether to return the day of the week in the context of a date.
       *
       * In the default \`en\` locale this has no effect,
       * however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization,
       * for example \`'Lundi'\` with \`{ context: false }\` and \`'lundi'\` with \`{ context: true }\` in \`fr\`.
       *
       * @default false
       */
      context?: boolean;
    }): string;
    /**
     * Returns a random day of the week.
     *
     * @param options The optional options to use.
     * @param options.abbr Deprecated, use \`abbreviated\` instead.
     * @param options.abbreviated Whether to return an abbreviation. Defaults to \`false\`.
     * @param options.context Whether to return the day of the week in the context of a date. In the default \`en\` locale this has no effect, however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization, for example \`'Lundi'\` with \`{ context: false }\` and \`'lundi'\` with \`{ context: true }\` in \`fr\`. Defaults to \`false\`.
     *
     * @example
     * faker.date.weekday() // 'Monday'
     * faker.date.weekday({ abbr: true }) // 'Thu'
     * faker.date.weekday({ context: true }) // 'Thursday'
     * faker.date.weekday({ abbr: true, context: true }) // 'Fri'
     *
     * @since 3.0.1
     *
     * @deprecated Use \`faker.date.weekday({ abbreviated, ... })\` instead.
     */
    weekday(options?: {
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       *
       * @deprecated Use \`abbreviated\` instead.
       */
      abbr?: boolean;
      /**
       * Whether to return the day of the week in the context of a date.
       *
       * In the default \`en\` locale this has no effect,
       * however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization,
       * for example \`'Lundi'\` with \`{ context: false }\` and \`'lundi'\` with \`{ context: true }\` in \`fr\`.
       *
       * @default false
       */
      context?: boolean;
    }): string;
    /**
     * Returns a random day of the week.
     *
     * @param options The optional options to use.
     * @param options.abbr Deprecated, use \`abbreviated\` instead.
     * @param options.abbreviated Whether to return an abbreviation. Defaults to \`false\`.
     * @param options.context Whether to return the day of the week in the context of a date. In the default \`en\` locale this has no effect, however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization, for example \`'Lundi'\` with \`{ context: false }\` and \`'lundi'\` with \`{ context: true }\` in \`fr\`. Defaults to \`false\`.
     *
     * @example
     * faker.date.weekday() // 'Monday'
     * faker.date.weekday({ abbreviated: true }) // 'Thu'
     * faker.date.weekday({ context: true }) // 'Thursday'
     * faker.date.weekday({ abbreviated: true, context: true }) // 'Fri'
     *
     * @since 3.0.1
     */
    weekday(options?: {
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       *
       * @deprecated Use \`abbreviated\` instead.
       */
      abbr?: boolean;
      /**
       * Whether to return an abbreviation.
       *
       * @default false
       */
      abbreviated?: boolean;
      /**
       * Whether to return the day of the week in the context of a date.
       *
       * In the default \`en\` locale this has no effect,
       * however, in other locales like \`fr\` or \`ru\`, this may affect grammar or capitalization,
       * for example \`'Lundi'\` with \`{ context: false }\` and \`'lundi'\` with \`{ context: true }\` in \`fr\`.
       *
       * @default false
       */
      context?: boolean;
    }): string;
    /**
     * Returns a random birthdate.
     *
     * @param options The options to use to generate the birthdate. If no options are set, an age between 18 and 80 (inclusive) is generated.
     * @param options.min The minimum age or year to generate a birthdate.
     * @param options.max The maximum age or year to generate a birthdate.
     * @param options.refDate The date to use as reference point for the newly generated date. Defaults to \`now\`.
     * @param options.mode The mode to generate the birthdate. Supported modes are \`'age'\` and \`'year'\` .
     *
     * There are two modes available \`'age'\` and \`'year'\`:
     * - \`'age'\`: The min and max options define the age of the person (e.g. \`18\` - \`42\`).
     * - \`'year'\`: The min and max options define the range the birthdate may be in (e.g. \`1900\` - \`2000\`).
     *
     * Defaults to \`year\`.
     *
     * @example
     * faker.date.birthdate() // 1977-07-10T01:37:30.719Z
     * faker.date.birthdate({ min: 18, max: 65, mode: 'age' }) // 2003-11-02T20:03:20.116Z
     * faker.date.birthdate({ min: 1900, max: 2000, mode: 'year' }) // 1940-08-20T08:53:07.538Z
     *
     * @since 7.0.0
     */
    birthdate(options?: {
      /**
       * The minimum age or year to generate a birthdate.
       *
       * @default 18
       */
      min?: number;
      /**
       * The maximum age or year to generate a birthdate.
       *
       * @default 80
       */
      max?: number;
      /**
       * The mode to generate the birthdate. Supported modes are \`'age'\` and \`'year'\` .
       *
       * There are two modes available \`'age'\` and \`'year'\`:
       * - \`'age'\`: The min and max options define the age of the person (e.g. \`18\` - \`42\`).
       * - \`'year'\`: The min and max options define the range the birthdate may be in (e.g. \`1900\` - \`2000\`).
       *
       * @default 'year'
       */
      mode?: "age" | "year";
      /**
       * The date to use as reference point for the newly generated date.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): Date;
  }
  interface Currency {
    /**
     * The full name for the currency (e.g. \`US Dollar\`).
     */
    name: string;
    /**
     * The code/short text/abbreviation for the currency (e.g. \`USD\`).
     */
    code: string;
    /**
     * The symbol for the currency (e.g. \`$\`).
     */
    symbol: string;
  }
  declare class FinanceModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a random account number.
     *
     * @param length The length of the account number. Defaults to \`8\`.
     *
     * @see faker.finance.accountNumber()
     *
     * @example
     * faker.finance.account() // 92842238
     * faker.finance.account(5) // 32564
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.finance.accountNumber\` instead.
     */
    account(length?: number): string;
    /**
     * Generates a random account number.
     *
     * @param length The length of the account number. Defaults to \`8\`.
     *
     * @example
     * faker.finance.accountNumber() // 92842238
     * faker.finance.accountNumber(5) // 32564
     *
     * @since 8.0.0
     */
    accountNumber(length?: number): string;
    /**
     * Generates a random account number.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.length The length of the account number. Defaults to \`8\`.
     *
     * @example
     * faker.finance.accountNumber() // 92842238
     * faker.finance.accountNumber({ length: 5 }) // 32564
     *
     * @since 8.0.0
     */
    accountNumber(options?: {
      /**
       * The length of the account number.
       *
       * @default 8
       */
      length?: number;
    }): string;
    /**
     * Generates a random account number.
     *
     * @param optionsOrLength An options object or the length of the account number. Defaults to \`{}\`.
     * @param optionsOrLength.length The length of the account number. Defaults to \`8\`.
     *
     * @example
     * faker.finance.accountNumber() // 92842238
     * faker.finance.accountNumber(5) // 28736
     * faker.finance.accountNumber({ length: 5 }) // 32564
     *
     * @since 8.0.0
     */
    accountNumber(optionsOrLength?: number | {
      /**
       * The length of the account number.
       *
       * @default 8
       */
      length?: number;
    }): string;
    /**
     * Generates a random account name.
     *
     * @example
     * faker.finance.accountName() // 'Personal Loan Account'
     *
     * @since 2.0.1
     */
    accountName(): string;
    /**
     * Generates a random routing number.
     *
     * @example
     * faker.finance.routingNumber() // '522814402'
     *
     * @since 5.0.0
     */
    routingNumber(): string;
    /**
     * Generates a random masked number.
     *
     * @param length The length of the unmasked number. Defaults to \`4\`.
     * @param parens Whether to use surrounding parenthesis. Defaults to \`true\`.
     * @param ellipsis Whether to prefix the numbers with an ellipsis. Defaults to \`true\`.
     *
     * @see faker.finance.maskedNumber()
     *
     * @example
     * faker.finance.mask() // '(...9711)'
     * faker.finance.mask(3) // '(...342)'
     * faker.finance.mask(3, false) // '...236'
     * faker.finance.mask(3, false, false) // '298'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.finance.maskedNumber\` instead.
     */
    mask(length?: number, parens?: boolean, ellipsis?: boolean): string;
    /**
     * Generates a random masked number.
     *
     * @param length The length of the unmasked number. Defaults to \`4\`.
     *
     * @example
     * faker.finance.maskedNumber() // '(...9711)'
     * faker.finance.maskedNumber(3) // '(...342)'
     *
     * @since 8.0.0
     */
    maskedNumber(length?: number): string;
    /**
     * Generates a random masked number.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.length The length of the unmasked number. Defaults to \`4\`.
     * @param options.parens Whether to use surrounding parenthesis. Defaults to \`true\`.
     * @param options.ellipsis Whether to prefix the numbers with an ellipsis. Defaults to \`true\`.
     *
     * @example
     * faker.finance.maskedNumber() // '(...9711)'
     * faker.finance.maskedNumber({ length: 3 }) // '(...342)'
     * faker.finance.maskedNumber({ length: 3, parens: false }) // '...236'
     * faker.finance.maskedNumber({ length: 3, parens: false, ellipsis: false }) // '298'
     *
     * @since 8.0.0
     */
    maskedNumber(options?: {
      length?: number;
      parens?: boolean;
      ellipsis?: boolean;
    }): string;
    /**
     * Generates a random masked number.
     *
     * @param optionsOrLength An options object or the length of the unmask number. Defaults to \`{}\`.
     * @param optionsOrLength.length The length of the unmasked number. Defaults to \`4\`.
     * @param optionsOrLength.parens Whether to use surrounding parenthesis. Defaults to \`true\`.
     * @param optionsOrLength.ellipsis Whether to prefix the numbers with an ellipsis. Defaults to \`true\`.
     *
     * @example
     * faker.finance.maskedNumber() // '(...9711)'
     * faker.finance.maskedNumber(3) // '(...342)'
     * faker.finance.maskedNumber({ length: 3 }) // '(...342)'
     * faker.finance.maskedNumber({ length: 3, parens: false }) // '...236'
     * faker.finance.maskedNumber({ length: 3, parens: false, ellipsis: false }) // '298'
     *
     * @since 8.0.0
     */
    maskedNumber(optionsOrLength?: number | {
      /**
       * The length of the unmasked number.
       *
       * @default 4
       */
      length?: number;
      /**
       * Whether to use surrounding parenthesis.
       *
       * @default true
       */
      parens?: boolean;
      /**
       * Whether to prefix the numbers with an ellipsis.
       *
       * @default true
       */
      ellipsis?: boolean;
    }): string;
    /**
     * Generates a random amount between the given bounds (inclusive).
     *
     * @param min The lower bound for the amount. Defaults to \`0\`.
     * @param max The upper bound for the amount. Defaults to \`1000\`.
     * @param dec The number of decimal places for the amount. Defaults to \`2\`.
     * @param symbol The symbol used to prefix the amount. Defaults to \`''\`.
     * @param autoFormat If true this method will use \`Number.toLocaleString()\`. Otherwise it will use \`Number.toFixed()\`.
     *
     * @example
     * faker.finance.amount() // '617.87'
     * faker.finance.amount(5, 10) // '5.53'
     * faker.finance.amount(5, 10, 0) // '8'
     * faker.finance.amount(5, 10, 2, '$') // '$5.85'
     * faker.finance.amount(5, 10, 5, '', true) // '9,75067'
     *
     * @since 2.0.1
     */
    amount(min?: number, max?: number, dec?: number, symbol?: string, autoFormat?: boolean): string;
    /**
     * Generates a random amount between the given bounds (inclusive).
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.min The lower bound for the amount. Defaults to \`0\`.
     * @param options.max The upper bound for the amount. Defaults to \`1000\`.
     * @param options.dec The number of decimal places for the amount. Defaults to \`2\`.
     * @param options.symbol The symbol used to prefix the amount. Defaults to \`''\`.
     * @param options.autoFormat If true this method will use \`Number.toLocaleString()\`. Otherwise it will use \`Number.toFixed()\`.
     *
     * @example
     * faker.finance.amount() // '617.87'
     * faker.finance.amount({ min: 5, max: 10 }) // '5.53'
     * faker.finance.amount({ min: 5, max: 10, dec: 0 }) // '8'
     * faker.finance.amount({ min: 5, max: 10, dec: 2, symbol: '$' }) // '$5.85'
     * faker.finance.amount({ min: 5, max: 10, dec: 5, symbol: '', autoFormat: true }) // '9,75067'
     *
     * @since 2.0.1
     */
    amount(options?: {
      /**
       * The lower bound for the amount.
       *
       * @default 0
       */
      min?: number;
      /**
       * The upper bound for the amount.
       *
       * @default 1000
       */
      max?: number;
      /**
       * The number of decimal places for the amount.
       *
       * @default 2
       */
      dec?: number;
      /**
       * The symbol used to prefix the amount.
       *
       * @default ''
       */
      symbol?: string;
      /**
       * If true this method will use \`Number.toLocaleString()\`. Otherwise it will use \`Number.toFixed()\`.
       *
       * @default false
       */
      autoFormat?: boolean;
    }): string;
    /**
     * Generates a random amount between the given bounds (inclusive).
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.min The lower bound for the amount. Defaults to \`0\`.
     * @param options.max The upper bound for the amount. Defaults to \`1000\`.
     * @param options.dec The number of decimal places for the amount. Defaults to \`2\`.
     * @param options.symbol The symbol used to prefix the amount. Defaults to \`''\`.
     * @param options.autoFormat If true this method will use \`Number.toLocaleString()\`. Otherwise it will use \`Number.toFixed()\`.
     * @param legacyMax The upper bound for the amount. Defaults to \`1000\`.
     * @param legacyDec The number of decimal places for the amount. Defaults to \`2\`.
     * @param legacySymbol The symbol used to prefix the amount. Defaults to \`''\`.
     * @param legacyAutoFormat If true this method will use \`Number.toLocaleString()\`. Otherwise it will use \`Number.toFixed()\`.
     *
     * @example
     * faker.finance.amount() // '617.87'
     * faker.finance.amount({ min: 5, max: 10 }) // '5.53'
     * faker.finance.amount({ min: 5, max: 10, dec: 0 }) // '8'
     * faker.finance.amount({ min: 5, max: 10, dec: 2, symbol: '$' }) // '$5.85'
     * faker.finance.amount({ min: 5, max: 10, dec: 5, symbol: '', autoFormat: true }) // '9,75067'
     * faker.finance.amount(5, 10) // '5.53'
     * faker.finance.amount(5, 10, 0) // '8'
     * faker.finance.amount(5, 10, 2, '$') // '$5.85'
     * faker.finance.amount(5, 10, 5, '', true) // '9,75067'
     *
     * @since 2.0.1
     */
    amount(options?: number | {
      /**
       * The lower bound for the amount.
       *
       * @default 0
       */
      min?: number;
      /**
       * The upper bound for the amount.
       *
       * @default 1000
       */
      max?: number;
      /**
       * The number of decimal places for the amount.
       *
       * @default 2
       */
      dec?: number;
      /**
       * The symbol used to prefix the amount.
       *
       * @default ''
       */
      symbol?: string;
      /**
       * If true this method will use \`Number.toLocaleString()\`. Otherwise it will use \`Number.toFixed()\`.
       *
       * @default false
       */
      autoFormat?: boolean;
    }, legacyMax?: number, legacyDec?: number, legacySymbol?: string, legacyAutoFormat?: boolean): string;
    /**
     * Returns a random transaction type.
     *
     * @example
     * faker.finance.transactionType() // 'payment'
     *
     * @since 2.0.1
     */
    transactionType(): string;
    /**
     * Returns a random currency object, containing \`code\`, \`name \`and \`symbol\` properties.
     *
     * @see
     * faker.finance.currencyCode()
     * faker.finance.currencyName()
     * faker.finance.currencySymbol()
     *
     * @example
     * faker.finance.currency() // { code: 'USD', name: 'US Dollar', symbol: '$' }
     *
     * @since 8.0.0
     */
    currency(): Currency;
    /**
     * Returns a random currency code.
     * (The short text/abbreviation for the currency (e.g. \`US Dollar\` -> \`USD\`))
     *
     * @example
     * faker.finance.currencyCode() // 'USD'
     *
     * @since 2.0.1
     */
    currencyCode(): string;
    /**
     * Returns a random currency name.
     *
     * @example
     * faker.finance.currencyName() // 'US Dollar'
     *
     * @since 2.0.1
     */
    currencyName(): string;
    /**
     * Returns a random currency symbol.
     *
     * @example
     * faker.finance.currencySymbol() // '$'
     *
     * @since 2.0.1
     */
    currencySymbol(): string;
    /**
     * Generates a random Bitcoin address.
     *
     * @example
     * faker.finance.bitcoinAddress() // '3ySdvCkTLVy7gKD4j6JfSaf5d'
     *
     * @since 3.1.0
     */
    bitcoinAddress(): string;
    /**
     * Generates a random Litecoin address.
     *
     * @example
     * faker.finance.litecoinAddress() // 'MoQaSTGWBRXkWfyxKbNKuPrAWGELzcW'
     *
     * @since 5.0.0
     */
    litecoinAddress(): string;
    /**
     * Generates a random credit card number.
     *
     * @param issuer The name of the issuer (case-insensitive) or the format used to generate one.
     *
     * @example
     * faker.finance.creditCardNumber() // '4427163488662'
     * faker.finance.creditCardNumber('visa') // '4882664999007'
     * faker.finance.creditCardNumber('63[7-9]#-####-####-###L') // '6375-3265-4676-6646'
     *
     * @since 5.0.0
     */
    creditCardNumber(issuer?: string): string;
    /**
     * Generates a random credit card number.
     *
     * @param options An options object. Defaults to \`''\`.
     * @param options.issuer The name of the issuer (case-insensitive) or the format used to generate one.
     *
     * @example
     * faker.finance.creditCardNumber() // '4427163488662'
     * faker.finance.creditCardNumber({ issuer: 'visa' }) // '4882664999007'
     * faker.finance.creditCardNumber({ issuer: '63[7-9]#-####-####-###L' }) // '6375-3265-4676-6646'
     *
     * @since 5.0.0
     */
    creditCardNumber(options?: {
      /**
       * The name of the issuer (case-insensitive) or the format used to generate one.
       *
       * @default ''
       */
      issuer?: string;
    }): string;
    /**
     * Generates a random credit card number.
     *
     * @param options An options object, the issuer or a custom format. Defaults to \`{}\`.
     * @param options.issuer The name of the issuer (case-insensitive) or the format used to generate one.
     *
     * @example
     * faker.finance.creditCardNumber() // '4427163488662'
     * faker.finance.creditCardNumber({ issuer: 'visa' }) // '4882664999007'
     * faker.finance.creditCardNumber({ issuer: '63[7-9]#-####-####-###L' }) // '6375-3265-4676-6646'
     * faker.finance.creditCardNumber('visa') // '1226423499765'
     *
     * @since 5.0.0
     */
    creditCardNumber(options?: string | {
      /**
       * The name of the issuer (case-insensitive) or the format used to generate one.
       *
       * @default ''
       */
      issuer?: string;
    }): string;
    /**
     * Generates a random credit card CVV.
     *
     * @example
     * faker.finance.creditCardCVV() // '506'
     *
     * @since 5.0.0
     */
    creditCardCVV(): string;
    /**
     * Returns a random credit card issuer.
     *
     * @example
     * faker.finance.creditCardIssuer() // 'discover'
     *
     * @since 6.3.0
     */
    creditCardIssuer(): string;
    /**
     * Generates a random PIN number.
     *
     * @param length The length of the PIN to generate. Defaults to \`4\`.
     *
     * @throws Will throw an error if length is less than 1.
     *
     * @example
     * faker.finance.pin() // '5067'
     * faker.finance.pin(6) // '213789'
     *
     * @since 6.2.0
     */
    pin(length?: number): string;
    /**
     * Generates a random PIN number.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.length The length of the PIN to generate. Defaults to \`4\`.
     *
     * @throws Will throw an error if length is less than 1.
     *
     * @example
     * faker.finance.pin() // '5067'
     * faker.finance.pin({ length: 6 }) // '213789'
     *
     * @since 6.2.0
     */
    pin(options?: {
      /**
       * The length of the PIN to generate.
       *
       * @default 4
       */
      length?: number;
    }): string;
    /**
     * Generates a random PIN number.
     *
     * @param options An options object or the length of the PIN. Defaults to \`{}\`.
     * @param options.length The length of the PIN to generate. Defaults to \`4\`.
     *
     * @throws Will throw an error if length is less than 1.
     *
     * @example
     * faker.finance.pin() // '5067'
     * faker.finance.pin({ length: 6 }) // '213789'
     * faker.finance.pin(6) // '213789'
     *
     * @since 6.2.0
     */
    pin(options?: number | {
      /**
       * The length of the PIN to generate.
       *
       * @default 4
       */
      length?: number;
    }): string;
    /**
     * Creates a random, non-checksum Ethereum address.
     *
     * To generate a checksummed Ethereum address (with specific per character casing), wrap this method in a custom method and use third-party libraries to transform the result.
     *
     * @example
     * faker.finance.ethereumAddress() // '0xf03dfeecbafc5147241cc4c4ca20b3c9dfd04c4a'
     *
     * @since 5.0.0
     */
    ethereumAddress(): string;
    /**
     * Generates a random iban.
     *
     * @param formatted Return a formatted version of the generated IBAN. Defaults to \`false\`.
     * @param countryCode The country code from which you want to generate an IBAN, if none is provided a random country will be used.
     *
     * @throws Will throw an error if the passed country code is not supported.
     *
     * @example
     * faker.finance.iban() // 'TR736918640040966092800056'
     * faker.finance.iban(true) // 'FR20 8008 2330 8984 74S3 Z620 224'
     * faker.finance.iban(true, 'DE') // 'DE84 1022 7075 0900 1170 01'
     *
     * @since 4.0.0
     */
    iban(formatted?: boolean, countryCode?: string): string;
    /**
     * Generates a random iban.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.formatted Return a formatted version of the generated IBAN. Defaults to \`false\`.
     * @param options.countryCode The country code from which you want to generate an IBAN, if none is provided a random country will be used.
     *
     * @throws Will throw an error if the passed country code is not supported.
     *
     * @example
     * faker.finance.iban() // 'TR736918640040966092800056'
     * faker.finance.iban({ formatted: true }) // 'FR20 8008 2330 8984 74S3 Z620 224'
     * faker.finance.iban({ formatted: true, countryCode: 'DE' }) // 'DE84 1022 7075 0900 1170 01'
     *
     * @since 4.0.0
     */
    iban(options?: {
      /**
       * Return a formatted version of the generated IBAN.
       *
       * @default false
       */
      formatted?: boolean;
      /**
       * The country code from which you want to generate an IBAN,
       * if none is provided a random country will be used.
       */
      countryCode?: string;
    }): string;
    /**
     * Generates a random iban.
     *
     * @param options An options object or whether the return value should be formatted. Defaults to \`{}\`.
     * @param options.formatted Return a formatted version of the generated IBAN. Defaults to \`false\`.
     * @param options.countryCode The country code from which you want to generate an IBAN, if none is provided a random country will be used.
     * @param legacyCountryCode The country code from which you want to generate an IBAN, if none is provided a random country will be used.
     *
     * @throws Will throw an error if the passed country code is not supported.
     *
     * @example
     * faker.finance.iban() // 'TR736918640040966092800056'
     * faker.finance.iban({ formatted: true }) // 'FR20 8008 2330 8984 74S3 Z620 224'
     * faker.finance.iban({ formatted: true, countryCode: 'DE' }) // 'DE84 1022 7075 0900 1170 01'
     * faker.finance.iban(true) // 'FR20 8008 2330 8984 74S3 Z620 224'
     * faker.finance.iban(true, 'DE') // 'DE84 1022 7075 0900 1170 01'
     *
     * @since 4.0.0
     */
    iban(options?: boolean | {
      /**
       * Return a formatted version of the generated IBAN.
       *
       * @default false
       */
      formatted?: boolean;
      /**
       * The country code from which you want to generate an IBAN,
       * if none is provided a random country will be used.
       */
      countryCode?: string;
    }, legacyCountryCode?: string): string;
    /**
     * Generates a random SWIFT/BIC code based on the [ISO-9362](https://en.wikipedia.org/wiki/ISO_9362) format.
     *
     * @param options Options object.
     * @param options.includeBranchCode Whether to include a three-digit branch code at the end of the generated code. Defaults to a random boolean value.
     *
     * @example
     * faker.finance.bic() // 'WYAUPGX1'
     * faker.finance.bic({ includeBranchCode: true }) // 'KCAUPGR1432'
     * faker.finance.bic({ includeBranchCode: false }) // 'XDAFQGT7'
     *
     * @since 4.0.0
     */
    bic(options?: {
      /**
       * Whether to include a three-digit branch code at the end of the generated code.
       *
       * @default faker.datatype.boolean()
       */
      includeBranchCode?: boolean;
    }): string;
    /**
     * Generates a random transaction description.
     *
     * @example
     * faker.finance.transactionDescription()
     * // 'invoice transaction at Kilback - Durgan using card ending with ***(...4316) for UAH 783.82 in account ***16168663'
     *
     * @since 5.1.0
     */
    transactionDescription(): string;
  }
  declare class GitModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a random branch name.
     *
     * @example
     * faker.git.branch() // 'feed-parse'
     *
     * @since 5.0.0
     */
    branch(): string;
    /**
     * Generates a random commit entry as printed by \`git log\`.
     *
     * @param options Options for the commit entry.
     * @param options.merge Set to \`true\` to generate a merge message line.
     * @param options.eol Choose the end of line character to use. Defaults to 'CRLF'.
     * 'LF' = '\n',
     * 'CRLF' = '\r\n'
     * @param options.refDate The date to use as reference point for the commit. Defaults to \`new Date()\`.
     *
     * @throws When the environment does not support \`Intl.NumberFormat\` and \`Intl.DateTimeFormat\`.
     *
     * @example
     * faker.git.commitEntry()
     * // commit fe8c38a965d13d9794eb36918cb24cebe49a45c2
     * // Author: Marion Becker <Marion_Becker49@gmail.com>
     * // Date: Mon Nov 7 05:38:37 2022 -0600
     * //
     * //     generate open-source system
     *
     * @since 5.0.0
     */
    commitEntry(options?: {
      /**
       * Set to \`true\` to generate a merge message line.
       *
       * @default faker.datatype.boolean({ probability: 0.2 })
       */
      merge?: boolean;
      /**
       * Choose the end of line character to use.
       *
       * - 'LF' = '\n',
       * - 'CRLF' = '\r\n'
       *
       * @default 'CRLF'
       */
      eol?: "LF" | "CRLF";
      /**
       * The date to use as reference point for the commit.
       *
       * @default new Date()
       */
      refDate?: string | Date | number;
    }): string;
    /**
     * Generates a random commit message.
     *
     * @example
     * faker.git.commitMessage() // 'reboot cross-platform driver'
     *
     * @since 5.0.0
     */
    commitMessage(): string;
    /**
     * Generates a date string for a git commit using the same format as \`git log\`.
     *
     * @param options The optional options object.
     * @param options.refDate The date to use as reference point for the commit. Defaults to \`faker.defaultRefDate()\`.
     *
     * @throws When the environment does not support \`Intl.NumberFormat\` and \`Intl.DateTimeFormat\`.
     *
     * @example
     * faker.git.commitDate() // 'Mon Nov 7 14:40:58 2022 +0600'
     * faker.git.commitDate({ refDate: '2020-01-01' }) // 'Tue Dec 31 05:40:59 2019 -0400'
     *
     * @since 8.0.0
     */
    commitDate(options?: {
      /**
       * The date to use as reference point for the commit.
       *
       * @default faker.defaultRefDate()
       */
      refDate?: string | Date | number;
    }): string;
    /**
     * Generates a random commit sha.
     *
     * By default, the length of the commit sha is 40 characters.
     *
     * For a shorter commit sha, use the \`length\` option.
     *
     * Usual short commit sha length is:
     * - 7 for GitHub
     * - 8 for GitLab
     *
     * @param options Options for the commit sha.
     * @param options.length The length of the commit sha. Defaults to 40.
     *
     * @example
     * faker.git.commitSha() // '2c6e3880fd94ddb7ef72d34e683cdc0c47bec6e6'
     *
     * @since 5.0.0
     */
    commitSha(options?: {
      /**
       * The length of the commit sha.
       *
       * @default 40
       */
      length?: number;
    }): string;
    /**
     * Generates a random commit sha (short).
     *
     * @example
     * faker.git.shortSha() // '6155732'
     *
     * @since 5.0.0
     *
     * @deprecated Use \`faker.git.commitSha({ length: 7 })\` instead.
     */
    shortSha(): string;
  }
  declare class HackerModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random hacker/IT abbreviation.
     *
     * @example
     * faker.hacker.abbreviation() // 'THX'
     *
     * @since 2.0.1
     */
    abbreviation(): string;
    /**
     * Returns a random hacker/IT adjective.
     *
     * @example
     * faker.hacker.adjective() // 'cross-platform'
     *
     * @since 2.0.1
     */
    adjective(): string;
    /**
     * Returns a random hacker/IT noun.
     *
     * @example
     * faker.hacker.noun() // 'system'
     *
     * @since 2.0.1
     */
    noun(): string;
    /**
     * Returns a random hacker/IT verb.
     *
     * @example
     * faker.hacker.verb() // 'copy'
     *
     * @since 2.0.1
     */
    verb(): string;
    /**
     * Returns a random hacker/IT verb for continuous actions (en: ing suffix; e.g. hacking).
     *
     * @example
     * faker.hacker.ingverb() // 'navigating'
     *
     * @since 2.0.1
     */
    ingverb(): string;
    /**
     * Generates a random hacker/IT phrase.
     *
     * @example
     * faker.hacker.phrase()
     * // 'If we override the card, we can get to the HDD feed through the back-end HDD sensor!'
     *
     * @since 2.0.1
     */
    phrase(): string;
  }
  type RecordKey = string | number | symbol;
  declare class HelpersModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Slugifies the given string.
     * For that all spaces (\` \`) are replaced by hyphens (\`-\`)
     * and most non word characters except for dots and hyphens will be removed.
     *
     * @param string The input to slugify.
     *
     * @example
     * faker.helpers.slugify() // ''
     * faker.helpers.slugify("Hello world!") // 'Hello-world'
     *
     * @since 2.0.1
     */
    slugify(string?: string): string;
    /**
     * Parses the given string symbol by symbol and replaces the placeholders with digits (\`0\` - \`9\`).
     * \`!\` will be replaced by digits >=2 (\`2\` - \`9\`).
     *
     * @param string The template string to parse.
     * @param symbol The symbol to replace with digits. Defaults to \`'#'\`.
     *
     * @example
     * faker.helpers.replaceSymbolWithNumber() // ''
     * faker.helpers.replaceSymbolWithNumber('#####') // '04812'
     * faker.helpers.replaceSymbolWithNumber('!####') // '27378'
     * faker.helpers.replaceSymbolWithNumber('Your pin is: !####') // '29841'
     *
     * @since 2.0.1
     */
    replaceSymbolWithNumber(string?: string, symbol?: string): string;
    /**
     * Parses the given string symbol by symbols and replaces the placeholder appropriately.
     *
     * - \`#\` will be replaced with a digit (\`0\` - \`9\`).
     * - \`?\` will be replaced with an upper letter ('A' - 'Z')
     * - and \`*\` will be replaced with either a digit or letter.
     *
     * @param string The template string to parse.
     *
     * @example
     * faker.helpers.replaceSymbols() // ''
     * faker.helpers.replaceSymbols('#####') // '98441'
     * faker.helpers.replaceSymbols('?????') // 'ZYRQQ'
     * faker.helpers.replaceSymbols('*****') // '4Z3P7'
     * faker.helpers.replaceSymbols('Your pin is: #?*#?*') // '0T85L1'
     *
     * @since 3.0.0
     */
    replaceSymbols(string?: string): string;
    /**
     * Replaces the symbols and patterns in a credit card schema including Luhn checksum.
     *
     * This method supports both range patterns \`[4-9]\` as well as the patterns used by \`replaceSymbolWithNumber()\`.
     * \`L\` will be replaced with the appropriate Luhn checksum.
     *
     * @param string The credit card format pattern. Defaults to \`6453-####-####-####-###L\`.
     * @param symbol The symbol to replace with a digit.
     *
     * @example
     * faker.helpers.replaceCreditCardSymbols() // '6453-4876-8626-8995-3771'
     * faker.helpers.replaceCreditCardSymbols('1234-[4-9]-##!!-L') // '1234-9-5298-2'
     *
     * @since 5.0.0
     */
    replaceCreditCardSymbols(string?: string, symbol?: string): string;
    /**
     * Replaces the regex like expressions in the given string with matching values.
     *
     * Supported patterns:
     * - \`.{times}\` => Repeat the character exactly \`times\` times.
     * - \`.{min,max}\` => Repeat the character \`min\` to \`max\` times.
     * - \`[min-max]\` => Generate a number between min and max (inclusive).
     *
     * @param string The template string to parse.
     *
     * @example
     * faker.helpers.regexpStyleStringParse() // ''
     * faker.helpers.regexpStyleStringParse('#{5}') // '#####'
     * faker.helpers.regexpStyleStringParse('#{2,9}') // '#######'
     * faker.helpers.regexpStyleStringParse('[500-15000]') // '8375'
     * faker.helpers.regexpStyleStringParse('#{3}test[1-5]') // '###test3'
     *
     * @since 5.0.0
     */
    regexpStyleStringParse(string?: string): string;
    /**
     * Generates a string matching the given regex like expressions.
     *
     * This function doesn't provide full support of actual \`RegExp\`.
     * Features such as grouping, anchors and character classes are not supported.
     * If you are looking for a library that randomly generates strings based on
     * \`RegExp\`s, see [randexp.js](https://github.com/fent/randexp.js)
     *
     * Supported patterns:
     * - \`x{times}\` => Repeat the \`x\` exactly \`times\` times.
     * - \`x{min,max}\` => Repeat the \`x\` \`min\` to \`max\` times.
     * - \`[x-y]\` => Randomly get a character between \`x\` and \`y\` (inclusive).
     * - \`[x-y]{times}\` => Randomly get a character between \`x\` and \`y\` (inclusive) and repeat it \`times\` times.
     * - \`[x-y]{min,max}\` => Randomly get a character between \`x\` and \`y\` (inclusive) and repeat it \`min\` to \`max\` times.
     * - \`[^...]\` => Randomly get an ASCII number or letter character that is not in the given range. (e.g. \`[^0-9]\` will get a random non-numeric character).
     * - \`[-...]\` => Include dashes in the range. Must be placed after the negate character \`^\` and before any character sets if used (e.g. \`[^-0-9]\` will not get any numeric characters or dashes).
     * - \`/[x-y]/i\` => Randomly gets an uppercase or lowercase character between \`x\` and \`y\` (inclusive).
     * - \`x?\` => Randomly decide to include or not include \`x\`.
     * - \`[x-y]?\` => Randomly decide to include or not include characters between \`x\` and \`y\` (inclusive).
     * - \`x*\` => Repeat \`x\` 0 or more times.
     * - \`[x-y]*\` => Repeat characters between \`x\` and \`y\` (inclusive) 0 or more times.
     * - \`x+\` => Repeat \`x\` 1 or more times.
     * - \`[x-y]+\` => Repeat characters between \`x\` and \`y\` (inclusive) 1 or more times.
     * - \`.\` => returns a wildcard ASCII character that can be any number, character or symbol. Can be combined with quantifiers as well.
     *
     * @param pattern The template string/RegExp to generate a matching string for.
     *
     * @throws If min value is more than max value in quantifier. e.g. \`#{10,5}\`
     * @throws If invalid quantifier symbol is passed in.
     *
     * @example
     * faker.helpers.fromRegExp('#{5}') // '#####'
     * faker.helpers.fromRegExp('#{2,9}') // '#######'
     * faker.helpers.fromRegExp('[1-7]') // '5'
     * faker.helpers.fromRegExp('#{3}test[1-5]') // '###test3'
     * faker.helpers.fromRegExp('[0-9a-dmno]') // '5'
     * faker.helpers.fromRegExp('[^a-zA-Z0-8]') // '9'
     * faker.helpers.fromRegExp('[a-d0-6]{2,8}') // 'a0dc45b0'
     * faker.helpers.fromRegExp('[-a-z]{5}') // 'a-zab'
     * faker.helpers.fromRegExp(/[A-Z0-9]{4}-[A-Z0-9]{4}/) // 'BS4G-485H'
     * faker.helpers.fromRegExp(/[A-Z]{5}/i) // 'pDKfh'
     * faker.helpers.fromRegExp(/.{5}/) // '14(#B'
     * faker.helpers.fromRegExp(/Joh?n/) // 'Jon'
     * faker.helpers.fromRegExp(/ABC*DE/) // 'ABDE'
     * faker.helpers.fromRegExp(/bee+p/) // 'beeeeeeeep'
     *
     * @since 8.0.0
     */
    fromRegExp(pattern: string | RegExp): string;
    /**
     * Takes an array and randomizes it in place then returns it.
     *
     * @template T The type of the elements to shuffle.
     *
     * @param list The array to shuffle.
     * @param options The options to use when shuffling.
     * @param options.inplace Whether to shuffle the array in place or return a new array. Defaults to \`false\`.
     *
     * @example
     * faker.helpers.shuffle(['a', 'b', 'c'], { inplace: true }) // [ 'b', 'c', 'a' ]
     *
     * @since 8.0.0
     */
    shuffle<T>(list: T[], options: {
      /**
       * Whether to shuffle the array in place or return a new array.
       *
       * @default false
       */
      inplace: true;
    }): T[];
    /**
     * Returns a randomized version of the array.
     *
     * @template T The type of the elements to shuffle.
     *
     * @param list The array to shuffle.
     * @param options The options to use when shuffling.
     * @param options.inplace Whether to shuffle the array in place or return a new array. Defaults to \`false\`.
     *
     * @example
     * faker.helpers.shuffle(['a', 'b', 'c']) // [ 'b', 'c', 'a' ]
     * faker.helpers.shuffle(['a', 'b', 'c'], { inplace: false }) // [ 'b', 'c', 'a' ]
     *
     * @since 2.0.1
     */
    shuffle<T>(list: ReadonlyArray<T>, options?: {
      /**
       * Whether to shuffle the array in place or return a new array.
       *
       * @default false
       */
      inplace?: false;
    }): T[];
    /**
     * Returns a randomized version of the array.
     *
     * @template T The type of the elements to shuffle.
     *
     * @param list The array to shuffle.
     * @param options The options to use when shuffling.
     * @param options.inplace Whether to shuffle the array in place or return a new array. Defaults to \`false\`.
     *
     * @example
     * faker.helpers.shuffle(['a', 'b', 'c']) // [ 'b', 'c', 'a' ]
     * faker.helpers.shuffle(['a', 'b', 'c'], { inplace: true }) // [ 'b', 'c', 'a' ]
     * faker.helpers.shuffle(['a', 'b', 'c'], { inplace: false }) // [ 'b', 'c', 'a' ]
     *
     * @since 2.0.1
     */
    shuffle<T>(list: T[], options?: {
      /**
       * Whether to shuffle the array in place or return a new array.
       *
       * @default false
       */
      inplace?: boolean;
    }): T[];
    /**
     * Takes an array of strings or function that returns a string
     * and outputs a unique array of strings based on that source.
     * This method does not store the unique state between invocations.
     *
     * @template T The type of the elements.
     *
     * @param source The strings to choose from or a function that generates a string.
     * @param length The number of elements to generate.
     *
     * @example
     * faker.helpers.uniqueArray(faker.word.sample, 50)
     * faker.helpers.uniqueArray(faker.definitions.person.first_name, 6)
     * faker.helpers.uniqueArray(["Hello", "World", "Goodbye"], 2)
     *
     * @since 6.0.0
     */
    uniqueArray<T>(source: ReadonlyArray<T> | (() => T), length: number): T[];
    /**
     * Replaces the \`{{placeholder}}\` patterns in the given string mustache style.
     *
     * @param str The template string to parse.
     * @param data The data used to populate the placeholders.
     * This is a record where the key is the template placeholder,
     * whereas the value is either a string or a function suitable for \`String.replace()\`.
     *
     * @example
     * faker.helpers.mustache('I found {{count}} instances of "{{word}}".', {
     *   count: () => \`\${faker.number.int()}\`,
     *   word: "this word",
     * }) // 'I found 57591 instances of "this word".'
     *
     * @since 2.0.1
     */
    mustache(str: string | undefined, data: Record<string, string | Parameters<string["replace"]>[1]>): string;
    /**
     * Returns the result of the callback if the probability check was successful, otherwise \`undefined\`.
     *
     * @template TResult The type of result of the given callback.
     *
     * @param callback The callback to that will be invoked if the probability check was successful.
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.probability The probability (\`[0.00, 1.00]\`) of the callback being invoked. Defaults to \`0.5\`.
     *
     * @example
     * faker.helpers.maybe(() => 'Hello World!') // 'Hello World!'
     * faker.helpers.maybe(() => 'Hello World!', { probability: 0.1 }) // undefined
     * faker.helpers.maybe(() => 'Hello World!', { probability: 0.9 }) // 'Hello World!'
     *
     * @since 6.3.0
     */
    maybe<TResult>(callback: () => TResult, options?: {
      /**
       * The probability (\`[0.00, 1.00]\`) of the callback being invoked.
       *
       * @default 0.5
       */
      probability?: number;
    }): TResult | undefined;
    /**
     * Returns a random key from given object.
     *
     * @template T The type of the object to select from.
     *
     * @param object The object to be used.
     *
     * @throws If the given object is empty.
     *
     * @example
     * faker.helpers.objectKey({ myProperty: 'myValue' }) // 'myProperty'
     *
     * @since 6.3.0
     */
    objectKey<T extends Record<string, unknown>>(object: T): keyof T;
    /**
     * Returns a random value from given object.
     *
     * @template T The type of object to select from.
     *
     * @param object The object to be used.
     *
     * @throws If the given object is empty.
     *
     * @example
     * faker.helpers.objectValue({ myProperty: 'myValue' }) // 'myValue'
     *
     * @since 6.3.0
     */
    objectValue<T extends Record<string, unknown>>(object: T): T[keyof T];
    /**
     * Returns a random \`[key, value]\` pair from the given object.
     *
     * @template T The type of the object to select from.
     *
     * @param object The object to be used.
     *
     * @throws If the given object is empty.
     *
     * @example
     * faker.helpers.objectEntry({ prop1: 'value1', prop2: 'value2' }) // ['prop1', 'value1']
     *
     * @since 8.0.0
     */
    objectEntry<T extends Record<string, unknown>>(object: T): [
      keyof T,
      T[keyof T]
    ];
    /**
     * Returns random element from the given array.
     *
     * @template T The type of the elements to pick from.
     *
     * @param array The array to pick the value from.
     *
     * @throws If the given array is empty.
     *
     * @example
     * faker.helpers.arrayElement(['cat', 'dog', 'mouse']) // 'dog'
     *
     * @since 6.3.0
     */
    arrayElement<T>(array: ReadonlyArray<T>): T;
    /**
     * Returns a weighted random element from the given array. Each element of the array should be an object with two keys \`weight\` and \`value\`.
     *
     * - Each \`weight\` key should be a number representing the probability of selecting the value, relative to the sum of the weights. Weights can be any positive float or integer.
     * - Each \`value\` key should be the corresponding value.
     *
     * For example, if there are two values A and B, with weights 1 and 2 respectively, then the probability of picking A is 1/3 and the probability of picking B is 2/3.
     *
     * @template T The type of the elements to pick from.
     *
     * @param array Array to pick the value from.
     * @param array[].weight The weight of the value.
     * @param array[].value The value to pick.
     *
     * @example
     * faker.helpers.weightedArrayElement([{ weight: 5, value: 'sunny' }, { weight: 4, value: 'rainy' }, { weight: 1, value: 'snowy' }]) // 'sunny', 50% of the time, 'rainy' 40% of the time, 'snowy' 10% of the time
     *
     * @since 8.0.0
     */
    weightedArrayElement<T>(array: ReadonlyArray<{
      /**
       * The weight of the value.
       */
      weight: number;
      /**
       * The value to pick.
       */
      value: T;
    }>): T;
    /**
     * Returns a subset with random elements of the given array in random order.
     *
     * @template T The type of the elements to pick from.
     *
     * @param array Array to pick the value from.
     * @param count Number or range of elements to pick.
     *    When not provided, random number of elements will be picked.
     *    When value exceeds array boundaries, it will be limited to stay inside.
     *
     * @example
     * faker.helpers.arrayElements(['cat', 'dog', 'mouse']) // ['mouse', 'cat']
     * faker.helpers.arrayElements([1, 2, 3, 4, 5], 2) // [4, 2]
     * faker.helpers.arrayElements([1, 2, 3, 4, 5], { min: 2, max: 4 }) // [3, 5, 1]
     *
     * @since 6.3.0
     */
    arrayElements<T>(array: ReadonlyArray<T>, count?: number | {
      /**
       * The minimum number of elements to pick.
       */
      min: number;
      /**
       * The maximum number of elements to pick.
       */
      max: number;
    }): T[];
    /**
     * Returns a random value from an Enum object.
     *
     * This does the same as \`objectValue\` except that it ignores (the values assigned to) the numeric keys added for TypeScript enums.
     *
     * @template T Type of generic enums, automatically inferred by TypeScript.
     *
     * @param enumObject Enum to pick the value from.
     *
     * @example
     * enum Color { Red, Green, Blue }
     * faker.helpers.enumValue(Color) // 1 (Green)
     *
     * enum Direction { North = 'North', South = 'South'}
     * faker.helpers.enumValue(Direction) // 'South'
     *
     * enum HttpStatus { Ok = 200, Created = 201, BadRequest = 400, Unauthorized = 401 }
     * faker.helpers.enumValue(HttpStatus) // 200 (Ok)
     *
     * @since 8.0.0
     */
    enumValue<T extends Record<string | number, string | number>>(enumObject: T): T[keyof T];
    /**
     * Generator for combining faker methods based on a static string input.
     *
     * Note: We recommend using string template literals instead of \`fake()\`,
     * which are faster and strongly typed (if you are using TypeScript),
     * e.g. \`\`const address = \`\${faker.location.zipCode()} \${faker.location.city()}\`;\`\`
     *
     * This method is useful if you have to build a random string from a static, non-executable source
     * (e.g. string coming from a user, stored in a database or a file).
     *
     * It checks the given string for placeholders and replaces them by calling faker methods:
     *
     * \`\`\`js
     * const hello = faker.helpers.fake('Hi, my name is {{person.firstName}} {{person.lastName}}!');
     * \`\`\`
     *
     * This would use the \`faker.person.firstName()\` and \`faker.person.lastName()\` method to resolve the placeholders respectively.
     *
     * It is also possible to provide parameters. At first, they will be parsed as json,
     * and if that isn't possible, we will fall back to string:
     *
     * \`\`\`js
     * const message = faker.helpers.fake('You can call me at {{phone.number(+!# !## #### #####!)}}.');
     * \`\`\`
     *
     * It is also possible to use multiple parameters (comma separated).
     *
     * \`\`\`js
     * const message = faker.helpers.fake('Your pin is {{string.numeric(4, {"allowLeadingZeros": true})}}.');
     * \`\`\`
     *
     * It is also NOT possible to use any non-faker methods or plain javascript in such patterns.
     *
     * @param pattern The pattern string that will get interpolated.
     *
     * @see faker.helpers.mustache() to use custom functions for resolution.
     *
     * @example
     * faker.helpers.fake('{{person.lastName}}') // 'Barrows'
     * faker.helpers.fake('{{person.lastName}}, {{person.firstName}} {{person.suffix}}') // 'Durgan, Noe MD'
     * faker.helpers.fake('This is static test.') // 'This is static test.'
     * faker.helpers.fake('Good Morning {{person.firstName}}!') // 'Good Morning Estelle!'
     * faker.helpers.fake('You can call me at {{phone.number(!## ### #####!)}}.') // 'You can call me at 202 555 973722.'
     * faker.helpers.fake('I flipped the coin and got: {{helpers.arrayElement(["heads", "tails"])}}') // 'I flipped the coin and got: tails'
     * faker.helpers.fake('Your PIN number is: {{string.numeric(4, {"exclude": ["0"]})}}') // 'Your PIN number is: 4834'
     *
     * @since 7.4.0
     */
    fake(pattern: string): string;
    /**
     * Generator for combining faker methods based on an array containing static string inputs.
     *
     * Note: We recommend using string template literals instead of \`fake()\`,
     * which are faster and strongly typed (if you are using TypeScript),
     * e.g. \`\`const address = \`\${faker.location.zipCode()} \${faker.location.city()}\`;\`\`
     *
     * This method is useful if you have to build a random string from a static, non-executable source
     * (e.g. string coming from a user, stored in a database or a file).
     *
     * It checks the given string for placeholders and replaces them by calling faker methods:
     *
     * \`\`\`js
     * const hello = faker.helpers.fake(['Hi, my name is {{person.firstName}} {{person.lastName}}!']);
     * \`\`\`
     *
     * This would use the \`faker.person.firstName()\` and \`faker.person.lastName()\` method to resolve the placeholders respectively.
     *
     * It is also possible to provide parameters. At first, they will be parsed as json,
     * and if that isn't possible, it will fall back to string:
     *
     * \`\`\`js
     * const message = faker.helpers.fake([
     *   'You can call me at {{phone.number(+!# !## #### #####!)}}.',
     *   'My email is {{internet.email}}.',
     * ]);
     * \`\`\`
     *
     * It is also possible to use multiple parameters (comma separated).
     *
     * \`\`\`js
     * const message = faker.helpers.fake(['Your pin is {{string.numeric(4, {"allowLeadingZeros": true})}}.']);
     * \`\`\`
     *
     * It is also NOT possible to use any non-faker methods or plain javascript in such patterns.
     *
     * @param patterns The array to select a pattern from, that will then get interpolated. Must not be empty.
     *
     * @see faker.helpers.mustache() to use custom functions for resolution.
     *
     * @example
     * faker.helpers.fake(['A: {{person.firstName}}', 'B: {{person.lastName}}']) // 'A: Barry'
     *
     * @since 8.0.0
     */
    fake(patterns: ReadonlyArray<string>): string;
    /**
     * Generator for combining faker methods based on a static string input or an array of static string inputs.
     *
     * Note: We recommend using string template literals instead of \`fake()\`,
     * which are faster and strongly typed (if you are using TypeScript),
     * e.g. \`\`const address = \`\${faker.location.zipCode()} \${faker.location.city()}\`;\`\`
     *
     * This method is useful if you have to build a random string from a static, non-executable source
     * (e.g. string coming from a user, stored in a database or a file).
     *
     * It checks the given string for placeholders and replaces them by calling faker methods:
     *
     * \`\`\`js
     * const hello = faker.helpers.fake('Hi, my name is {{person.firstName}} {{person.lastName}}!');
     * \`\`\`
     *
     * This would use the \`faker.person.firstName()\` and \`faker.person.lastName()\` method to resolve the placeholders respectively.
     *
     * It is also possible to provide parameters. At first, they will be parsed as json,
     * and if that isn't possible, it will fall back to string:
     *
     * \`\`\`js
     * const message = faker.helpers.fake('You can call me at {{phone.number(+!# !## #### #####!)}}.');
     * \`\`\`
     *
     * It is also possible to use multiple parameters (comma separated).
     *
     * \`\`\`js
     * const message = faker.helpers.fake('Your pin is {{string.numeric(4, {"allowLeadingZeros": true})}}.');
     * \`\`\`
     *
     * It is also NOT possible to use any non-faker methods or plain javascript in such patterns.
     *
     * @param pattern The pattern string that will get interpolated. If an array is passed, a random element will be picked and interpolated.
     *
     * @see faker.helpers.mustache() to use custom functions for resolution.
     *
     * @example
     * faker.helpers.fake('{{person.lastName}}') // 'Barrows'
     * faker.helpers.fake('{{person.lastName}}, {{person.firstName}} {{person.suffix}}') // 'Durgan, Noe MD'
     * faker.helpers.fake('This is static test.') // 'This is static test.'
     * faker.helpers.fake('Good Morning {{person.firstName}}!') // 'Good Morning Estelle!'
     * faker.helpers.fake('You can visit me at {{location.streetAddress(true)}}.') // 'You can visit me at 3393 Ronny Way Apt. 742.'
     * faker.helpers.fake('I flipped the coin and got: {{helpers.arrayElement(["heads", "tails"])}}') // 'I flipped the coin and got: tails'
     * faker.helpers.fake(['A: {{person.firstName}}', 'B: {{person.lastName}}']) // 'A: Barry'
     *
     * @since 7.4.0
     */
    fake(pattern: string | ReadonlyArray<string>): string;
    /**
     * Helper method that converts the given number or range to a number.
     *
     * @param numberOrRange The number or range to convert.
     * @param numberOrRange.min The minimum value for the range.
     * @param numberOrRange.max The maximum value for the range.
     *
     * @example
     * faker.helpers.rangeToNumber(1) // 1
     * faker.helpers.rangeToNumber({ min: 1, max: 10 }) // 5
     *
     * @since 8.0.0
     */
    rangeToNumber(numberOrRange: number | {
      /**
       * The minimum value for the range.
       */
      min: number;
      /**
       * The maximum value for the range.
       */
      max: number;
    }): number;
    /**
     * Generates a unique result using the results of the given method.
     * Used unique entries will be stored internally and filtered from subsequent calls.
     *
     * @template TMethod The type of the method to execute.
     *
     * @param method The method used to generate the values.
     * @param args The arguments used to call the method.
     * @param options The optional options used to configure this method.
     * @param options.startTime This parameter does nothing.
     * @param options.maxTime The time in milliseconds this method may take before throwing an error. Defaults to \`50\`.
     * @param options.maxRetries The total number of attempts to try before throwing an error. Defaults to \`50\`.
     * @param options.currentIterations This parameter does nothing.
     * @param options.exclude The value or values that should be excluded/skipped. Defaults to \`[]\`.
     * @param options.compare The function used to determine whether a value was already returned. Defaults to check the existence of the key.
     * @param options.store The store of unique entries. Defaults to a global store.
     *
     * @see https://github.com/faker-js/faker/issues/1785#issuecomment-1407773744
     *
     * @example
     * faker.helpers.unique(faker.person.firstName) // 'Corbin'
     *
     * @since 7.5.0
     *
     * @deprecated Please find a dedicated npm package instead, or even create one on your own if you want to.
     * More info can be found in issue [faker-js/faker #1785](https://github.com/faker-js/faker/issues/1785).
     */
    unique<TMethod extends (...parameters: any[]) => RecordKey>(method: TMethod, args?: Parameters<TMethod>, options?: {
      /**
       * This parameter does nothing.
       *
       * @default new Date().getTime()
       */
      startTime?: number;
      /**
       * The time in milliseconds this method may take before throwing an error.
       *
       * @default 50
       */
      maxTime?: number;
      /**
       * The total number of attempts to try before throwing an error.
       *
       * @default 50
       */
      maxRetries?: number;
      /**
       * This parameter does nothing.
       *
       * @default 0
       */
      currentIterations?: number;
      /**
       * The value or values that should be excluded/skipped.
       *
       * @default []
       */
      exclude?: RecordKey | RecordKey[];
      /**
       * The function used to determine whether a value was already returned.
       *
       * Defaults to check the existence of the key.
       *
       * @default (obj, key) => (obj[key] === undefined ? -1 : 0)
       */
      compare?: (obj: Record<RecordKey, RecordKey>, key: RecordKey) => 0 | -1;
      /**
       * The store of unique entries.
       *
       * Defaults to a global store.
       */
      store?: Record<RecordKey, RecordKey>;
    }): ReturnType<TMethod>;
    /**
     * Generates an array containing values returned by the given method.
     *
     * @template TResult The type of elements.
     *
     * @param method The method used to generate the values.
     * @param options The optional options object.
     * @param options.count The number or range of elements to generate. Defaults to \`3\`.
     *
     * @example
     * faker.helpers.multiple(faker.person.firstName) // [ 'Aniya', 'Norval', 'Dallin' ]
     * faker.helpers.multiple(faker.person.firstName, { count: 3 }) // [ 'Santos', 'Lavinia', 'Lavinia' ]
     *
     * @since 8.0.0
     */
    multiple<TResult>(method: () => TResult, options?: {
      /**
       * The number or range of elements to generate.
       *
       * @default 3
       */
      count?: number | {
        /**
         * The minimum value for the range.
         */
        min: number;
        /**
         * The maximum value for the range.
         */
        max: number;
      };
    }): TResult[];
  }
  declare class LoremPicsum {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a new picsum photos image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param grayscale Whether to return a grayscale image. Default to \`false\`.
     * @param blur The optional level of blur to apply. Supports \`1\` - \`10\`.
     *
     * @deprecated Use \`faker.image.urlPicsumPhotos\` instead.
     */
    image(width?: number, height?: number, grayscale?: boolean, blur?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): string;
    /**
     * Generates a new picsum photos image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param grayscale Whether to return a grayscale image. Default to \`false\`.
     *
     * @deprecated Use \`faker.image.urlPicsumPhotos\` instead.
     */
    imageGrayscale(width?: number, height?: number, grayscale?: boolean): string;
    /**
     * Generates a new picsum photos image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param blur The optional level of blur to apply. Supports \`1\` - \`10\`.
     *
     * @deprecated Use \`faker.image.urlPicsumPhotos\` instead.
     */
    imageBlurred(width?: number, height?: number, blur?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): string;
    /**
     * Generates a new picsum photos image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param grayscale Whether to return a grayscale image. Default to \`false\`.
     * @param blur The optional level of blur to apply. Supports \`1\` - \`10\`.
     * @param seed The optional seed to use.
     *
     * @deprecated Use \`faker.image.urlPicsumPhotos\` instead.
     */
    imageRandomSeeded(width?: number, height?: number, grayscale?: boolean, blur?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, seed?: string): string;
    /**
     * Generates a new picsum photos image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param grayscale Whether to return a grayscale image. Default to \`false\`.
     * @param blur The optional level of blur to apply. Supports \`1\` - \`10\`.
     * @param seed The optional seed to use.
     *
     * @deprecated Use \`faker.image.urlPicsumPhotos\` instead.
     */
    imageUrl(width?: number, height?: number, grayscale?: boolean, blur?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, seed?: string): string;
  }
  declare class Placeholder {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a new placeholder image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image (in pixels). Defaults to \`640\`.
     * @param height The height of the image (in pixels). Defaults to \`width\`.
     * @param text The text of the image.
     * @param format The file format of the image. Supports \`png\`, \`jpeg\`, \`png\`, \`gif\`, \`webp\`.
     * @param backgroundColor The background color of the placeholder. Supports HEX CODE format.
     * @param textColor The text color of the placeholder. Requires \`backgroundColor\`. Supports HEX CODE format.
     *
     * @example
     * faker.image.placeholder.imageUrl() // https://via.placeholder.com/640x640
     * faker.image.placeholder.imageUrl(200) // https://via.placeholder.com/200x200
     * faker.image.placeholder.imageUrl(200, 100) // https://via.placeholder.com/200x100
     * faker.image.placeholder.imageUrl(200, 100, 'Fish') // https://via.placeholder.com/200x100?text=Fish
     * faker.image.placeholder.imageUrl(200, 100, 'Fish', 'webp') // https://via.placeholder.com/200x100.webp?text=Fish
     * faker.image.placeholder.imageUrl(200, 100, 'Fish', 'webp') // https://via.placeholder.com/200x100.webp?text=Fish
     * faker.image.placeholder.imageUrl(200, 100, 'Fish', 'webp', '000000', 'ffffff) // https://via.placeholder.com/200x100/000000/FFFFFF.webp?text=Fish
     *
     * @deprecated Use \`faker.image.urlPlaceholder\` instead.
     */
    imageUrl(width?: number, height?: number, text?: string, format?: "png" | "jpeg" | "jpg" | "gif" | "webp", backgroundColor?: string, textColor?: string): string;
    /**
     * Generate a new placeholder image with random colors and text.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image (in pixels). Defaults to \`640\`.
     * @param height The height of the image (in pixels). Defaults to \`width\`.
     * @param format The file format of the image. Supports \`png\` \`jpeg\` \`png\` \`gif\` \`webp\`.
     *
     * @example
     * faker.image.placeholder.randomUrl() // https://via.placeholder.com/640x640/000000/ffffff?text=lorum
     * faker.image.placeholder.randomUrl(150) // https://via.placeholder.com/150x150/000000/ffffff?text=lorum
     * faker.image.placeholder.randomUrl(150, 200) // https://via.placeholder.com/150x200/000000/ffffff?text=lorum
     * faker.image.placeholder.randomUrl(150, 200, 'png') // https://via.placeholder.com/150x200/000000/ffffff.png?text=lorum
     *
     * @deprecated Use \`faker.image.urlPlaceholder\` instead.
     */
    randomUrl(width?: number, height?: number, format?: "png" | "jpeg" | "jpg" | "gif" | "webp"): string;
  }
  declare class Unsplash {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a new unsplash image url for a random supported category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    image(width?: number, height?: number, keyword?: string): string;
    /**
     * Generates a new unsplash image url.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param category The category of the image to generate.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    imageUrl(width?: number, height?: number, category?: string, keyword?: string): string;
    /**
     * Generates a new unsplash image url using the "food" category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    food(width?: number, height?: number, keyword?: string): string;
    /**
     * Generates a new unsplash image url using the "people" category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    people(width?: number, height?: number, keyword?: string): string;
    /**
     * Generates a new unsplash image url using the "nature" category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    nature(width?: number, height?: number, keyword?: string): string;
    /**
     * Generates a new unsplash image url using the "technology" category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    technology(width?: number, height?: number, keyword?: string): string;
    /**
     * Generates a new unsplash image url using the "objects" category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    objects(width?: number, height?: number, keyword?: string): string;
    /**
     * Generates a new unsplash image url using the "buildings" category.
     *
     * These images are fetched from an external service outside the control of Faker and could occasionally contain URLs which point to unexpected, disturbing, or offensive images. Usage limits may contribute to this behavior.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param keyword The image keywords to use.
     *
     * @deprecated Use \`faker.image\` instead.
     */
    buildings(width?: number, height?: number, keyword?: string): string;
  }
  declare class ImageModule {
    private readonly faker;
    /**
     * @deprecated Use \`faker.image\` instead.
     */
    readonly unsplash: Unsplash;
    /**
     * @deprecated Use \`faker.image\` instead.
     */
    readonly lorempicsum: LoremPicsum;
    /**
     * @deprecated Use \`faker.image.urlPlaceholder\` instead.
     */
    readonly placeholder: Placeholder;
    constructor(faker: Faker);
    /**
     * Generates a random avatar image url.
     *
     * @example
     * faker.image.avatar()
     * // 'https://avatars.githubusercontent.com/u/97165289'
     *
     * @since 2.0.1
     */
    avatar(): string;
    /**
     * Generates a random avatar from GitHub.
     *
     * @example
     * faker.image.avatarGitHub()
     * // 'https://avatars.githubusercontent.com/u/97165289'
     *
     * @since 8.0.0
     */
    avatarGitHub(): string;
    /**
     * Generates a random avatar from \`https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar\`.
     *
     * @example
     * faker.image.avatarLegacy()
     * // 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/170.jpg'
     *
     * @since 8.0.0
     */
    avatarLegacy(): string;
    /**
     * Generates a random image url.
     *
     * @param options Options for generating a URL for an image.
     * @param options.width The width of the image. Defaults to \`640\`.
     * @param options.height The height of the image. Defaults to \`480\`.
     *
     * @example
     * faker.image.url() // 'https://loremflickr.com/640/480?lock=1234'
     *
     * @since 8.0.0
     */
    url(options?: {
      /**
       * The width of the image.
       *
       * @default 640
       */
      width?: number;
      /**
       * The height of the image.
       *
       * @default 480
       */
      height?: number;
    }): string;
    /**
     * Generates a random image url provided via https://loremflickr.com.
     *
     * @param options Options for generating a URL for an image.
     * @param options.width The width of the image. Defaults to \`640\`.
     * @param options.height The height of the image. Defaults to \`480\`.
     * @param options.category Category to use for the image.
     *
     * @example
     * faker.image.urlLoremFlickr() // 'https://loremflickr.com/640/480?lock=1234'
     * faker.image.urlLoremFlickr({ width: 128 }) // 'https://loremflickr.com/128/480?lock=1234'
     * faker.image.urlLoremFlickr({ height: 128 }) // 'https://loremflickr.com/640/128?lock=1234'
     * faker.image.urlLoremFlickr({ category: 'nature' }) // 'https://loremflickr.com/640/480/nature?lock=1234'
     *
     * @since 8.0.0
     */
    urlLoremFlickr(options?: {
      /**
       * The width of the image.
       *
       * @default 640
       */
      width?: number;
      /**
       * The height of the image.
       *
       * @default 480
       */
      height?: number;
      /**
       * Category to use for the image.
       */
      category?: string;
    }): string;
    /**
     * Generates a random image url provided via https://picsum.photos.
     *
     * @param options Options for generating a URL for an image.
     * @param options.width The width of the image. Defaults to \`640\`.
     * @param options.height The height of the image. Defaults to \`480\`.
     * @param options.grayscale Whether the image should be grayscale. Defaults to \`false\`.
     * @param options.blur Whether the image should be blurred. Defaults to \`false\`.
     *
     * @example
     * faker.image.urlPicsumPhotos() // 'https://picsum.photos/seed/NWbJM2B/640/480'
     * faker.image.urlPicsumPhotos({ width: 128 }) // 'https://picsum.photos/seed/NWbJM2B/128/480'
     * faker.image.urlPicsumPhotos({ height: 128 }) // 'https://picsum.photos/seed/NWbJM2B/640/128'
     * faker.image.urlPicsumPhotos({ grayscale: true }) // 'https://picsum.photos/seed/NWbJM2B/640/480?grayscale'
     * faker.image.urlPicsumPhotos({ blur: 4 }) // 'https://picsum.photos/seed/NWbJM2B/640/480?blur=4'
     * faker.image.urlPicsumPhotos({ blur: 4, grayscale: true }) // 'https://picsum.photos/seed/NWbJM2B/640/480?grayscale&blur=4'
     *
     * @since 8.0.0
     */
    urlPicsumPhotos(options?: {
      /**
       * The width of the image.
       *
       * @default 640
       */
      width?: number;
      /**
       * The height of the image.
       *
       * @default 480
       */
      height?: number;
      /**
       * Whether the image should be grayscale.
       *
       * @default false
       */
      grayscale?: boolean;
      /**
       * Whether the image should be blurred.
       *
       * @default false
       */
      blur?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    }): string;
    /**
     * Generates a random image url provided via https://via.placeholder.com/.
     *
     * @param options Options for generating a URL for an image.
     * @param options.width The width of the image. Defaults to random number between 1 and 3999.
     * @param options.height The height of the image. Defaults to random number between 1 and 3999.
     * @param options.backgroundColor The background color of the image. Defaults to random hex color.
     * @param options.textColor The text color of the image. Defaults to random hex color.
     * @param options.format The format of the image. Defaults to random format.
     * @param options.text The text to display on the image. Defaults to string.
     *
     * @example
     * faker.image.urlPlaceholder() // 'https://via.placeholder.com/150x180/FF0000/FFFFFF.webp?text=lorem'
     * faker.image.urlPlaceholder({ width: 128 }) // 'https://via.placeholder.com/128x180/FF0000/FFFFFF.webp?text=lorem'
     * faker.image.urlPlaceholder({ height: 128 }) // 'https://via.placeholder.com/150x128/FF0000/FFFFFF.webp?text=lorem'
     * faker.image.urlPlaceholder({ backgroundColor: '000000' }) // 'https://via.placeholder.com/150x180/000000/FFFFFF.webp?text=lorem'
     * faker.image.urlPlaceholder({ textColor: '000000' }) // 'https://via.placeholder.com/150x180/FF0000/000000.webp?text=lorem'
     * faker.image.urlPlaceholder({ format: 'png' }) // 'https://via.placeholder.com/150x180/FF0000/FFFFFF.png?text=lorem'
     * faker.image.urlPlaceholder({ text: 'lorem ipsum' }) // 'https://via.placeholder.com/150x180/FF0000/FFFFFF.webp?text=lorem+ipsum'
     * faker.image.urlPlaceholder({ width: 128, height: 128, backgroundColor: '000000', textColor: 'FF0000', format: 'png', text: 'lorem ipsum' }) // 'https://via.placeholder.com/128x128/000000/FF0000.png?text=lorem+ipsum'
     *
     * @since 8.0.0
     */
    urlPlaceholder(options?: {
      /**
       * The width of the image.
       *
       * @default faker.number.int({ min: 1, max: 3999 })
       */
      width?: number;
      /**
       * The height of the image.
       *
       * @default faker.number.int({ min: 1, max: 3999 })
       */
      height?: number;
      /**
       * The background color of the image.
       *
       * @default faker.color.rgb({ format: 'hex', prefix: '' })
       */
      backgroundColor?: string;
      /**
       * The text color of the image.
       *
       * @default faker.color.rgb({ format: 'hex', prefix: '' })
       */
      textColor?: string;
      /**
       * The format of the image.
       *
       * @default faker.helpers.arrayElement(['gif', 'jpeg', 'jpg', 'png', 'webp'])
       */
      format?: "gif" | "jpeg" | "jpg" | "png" | "webp";
      /**
       * The text to display on the image.
       *
       * @default faker.lorem.words()
       */
      text?: string;
    }): string;
    /**
     * Generates a random data uri containing an svg image.
     *
     * @param options Options for generating a data uri.
     * @param options.width The width of the image. Defaults to \`640\`.
     * @param options.height The height of the image. Defaults to \`480\`.
     * @param options.color The color of the image. Defaults to \`grey\`.
     *
     * @example
     * faker.image.dataUri() // 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http...'
     *
     * @since 4.0.0
     */
    dataUri(options?: {
      /**
       * The width of the image.
       *
       * @default 640
       */
      width?: number;
      /**
       * The height of the image.
       *
       * @default 480
       */
      height?: number;
      /**
       * The color of the image.
       *
       * @default 'grey'
       */
      color?: string;
    }): string;
    /**
     * Generates a random image url from one of the supported categories.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @example
     * faker.image.image() // 'https://loremflickr.com/640/480/city'
     * faker.image.image(1234, 2345) // 'https://loremflickr.com/1234/2345/sports'
     * faker.image.image(1234, 2345, true) // 'https://loremflickr.com/1234/2345/nature?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.url\` instead.
     */
    image(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param category The category of the image. By default, a random one will be selected.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @example
     * faker.image.imageUrl() // 'https://loremflickr.com/640/480'
     * faker.image.imageUrl(1234, 2345) // 'https://loremflickr.com/1234/2345'
     * faker.image.imageUrl(1234, 2345, 'cat') // 'https://loremflickr.com/1234/2345/cat'
     * faker.image.imageUrl(1234, 2345, 'cat', true) // 'https://loremflickr.com/1234/2345/cat?lock=6849'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.url\` instead.
     */
    imageUrl(width?: number, height?: number, category?: string, randomize?: boolean): string;
    /**
     * Generates a random abstract image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.abstract() // 'https://loremflickr.com/640/480/abstract'
     * faker.image.abstract(1234, 2345) // 'https://loremflickr.com/1234/2345/abstract'
     * faker.image.abstract(1234, 2345, true) // 'https://loremflickr.com/1234/2345/abstract?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'abstract' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     *
     */
    abstract(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random animal image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.animals() // 'https://loremflickr.com/640/480/animals'
     * faker.image.animals(1234, 2345) // 'https://loremflickr.com/1234/2345/animals'
     * faker.image.animals(1234, 2345, true) // 'https://loremflickr.com/1234/2345/animals?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'animals' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     *
     */
    animals(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random business image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.business() // 'https://loremflickr.com/640/480/business'
     * faker.image.business(1234, 2345) // 'https://loremflickr.com/1234/2345/business'
     * faker.image.business(1234, 2345, true) // 'https://loremflickr.com/1234/2345/business?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'business' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     *
     *
     */
    business(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random cat image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.cats() // 'https://loremflickr.com/640/480/cats'
     * faker.image.cats(1234, 2345) // 'https://loremflickr.com/1234/2345/cats'
     * faker.image.cats(1234, 2345, true) // 'https://loremflickr.com/1234/2345/cats?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'cats' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    cats(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random city image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.city() // 'https://loremflickr.com/640/480/city'
     * faker.image.city(1234, 2345) // 'https://loremflickr.com/1234/2345/city'
     * faker.image.city(1234, 2345, true) // 'https://loremflickr.com/1234/2345/city?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'city' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    city(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random food image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.food() // 'https://loremflickr.com/640/480/food'
     * faker.image.food(1234, 2345) // 'https://loremflickr.com/1234/2345/food'
     * faker.image.food(1234, 2345, true) // 'https://loremflickr.com/1234/2345/food?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'food' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    food(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random nightlife image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.nightlife() // 'https://loremflickr.com/640/480/nightlife'
     * faker.image.nightlife(1234, 2345) // 'https://loremflickr.com/1234/2345/nightlife'
     * faker.image.nightlife(1234, 2345, true) // 'https://loremflickr.com/1234/2345/nightlife?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'nightlife' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    nightlife(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random fashion image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.fashion() // 'https://loremflickr.com/640/480/fashion'
     * faker.image.fashion(1234, 2345) // 'https://loremflickr.com/1234/2345/fashion'
     * faker.image.fashion(1234, 2345, true) // 'https://loremflickr.com/1234/2345/fashion?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'fashion' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    fashion(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random people image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.people() // 'https://loremflickr.com/640/480/people'
     * faker.image.people(1234, 2345) // 'https://loremflickr.com/1234/2345/people'
     * faker.image.people(1234, 2345, true) // 'https://loremflickr.com/1234/2345/people?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'people' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    people(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random nature image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.nature() // 'https://loremflickr.com/640/480/nature'
     * faker.image.nature(1234, 2345) // 'https://loremflickr.com/1234/2345/nature'
     * faker.image.nature(1234, 2345, true) // 'https://loremflickr.com/1234/2345/nature?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'nature' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    nature(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random sports image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.sports() // 'https://loremflickr.com/640/480/sports'
     * faker.image.sports(1234, 2345) // 'https://loremflickr.com/1234/2345/sports'
     * faker.image.sports(1234, 2345, true) // 'https://loremflickr.com/1234/2345/sports?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'sports' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    sports(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random technics image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.technics() // 'https://loremflickr.com/640/480/technics'
     * faker.image.technics(1234, 2345) // 'https://loremflickr.com/1234/2345/technics'
     * faker.image.technics(1234, 2345, true) // 'https://loremflickr.com/1234/2345/technics?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'technics' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     */
    technics(width?: number, height?: number, randomize?: boolean): string;
    /**
     * Generates a random transport image url.
     *
     * @param width The width of the image. Defaults to \`640\`.
     * @param height The height of the image. Defaults to \`480\`.
     * @param randomize Whether to randomize the image or not. Defaults to \`false\`.
     *
     * @see faker.image.url()
     * @see faker.image.urlLoremFlickr()
     *
     * @example
     * faker.image.transport() // 'https://loremflickr.com/640/480/transport'
     * faker.image.transport(1234, 2345) // 'https://loremflickr.com/1234/2345/transport'
     * faker.image.transport(1234, 2345, true) // 'https://loremflickr.com/1234/2345/transport?lock=56789'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.image.urlLoremFlickr({ category: 'transport' })\` if you want an image from LoremFlickr in the correct category, or \`faker.image.url()\` if you just want any image.
     *
     *
     */
    transport(width?: number, height?: number, randomize?: boolean): string;
  }
  type EmojiType = "smiley" | "body" | "person" | "nature" | "food" | "travel" | "activity" | "object" | "symbol" | "flag";
  type HTTPStatusCodeType = "informational" | "success" | "clientError" | "serverError" | "redirection";
  type HTTPProtocolType = "http" | "https";
  declare class InternetModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random avatar url.
     *
     * @example
     * faker.internet.avatar()
     * // 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/315.jpg'
     *
     * @since 2.0.1
     */
    avatar(): string;
    /**
     * Generates an email address using the given person's name as base.
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param options.provider The mail provider domain to use. If not specified, a random free mail provider will be chosen.
     * @param options.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     *
     * @example
     * faker.internet.email() // 'Kassandra4@hotmail.com'
     * faker.internet.email({ firstName: 'Jeanne', lastName: 'Doe' }) // 'Jeanne63@yahoo.com'
     * faker.internet.email({ firstName: 'Jeanne', lastName: 'Doe', provider: 'example.fakerjs.dev' }) // 'Jeanne_Doe88@example.fakerjs.dev'
     * faker.internet.email({ firstName: 'Jeanne', lastName: 'Doe', provider: 'example.fakerjs.dev', allowSpecialCharacters: true }) // 'Jeanne%Doe88@example.fakerjs.dev'
     *
     * @since 2.0.1
     */
    email(options?: {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
      /**
       * The mail provider domain to use. If not specified, a random free mail provider will be chosen.
       */
      provider?: string;
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }): string;
    /**
     * Generates an email address using the given person's name as base.
     *
     * @param firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param provider The mail provider domain to use. If not specified, a random free mail provider will be chosen.
     * @param options The options to use. Defaults to \`{ allowSpecialCharacters: false }\`.
     * @param options.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     *
     * @example
     * faker.internet.email() // 'Kassandra4@hotmail.com'
     * faker.internet.email('Jeanne', 'Doe') // 'Jeanne63@yahoo.com'
     * faker.internet.email('Jeanne', 'Doe', 'example.fakerjs.dev') // 'Jeanne_Doe88@example.fakerjs.dev'
     * faker.internet.email('Jeanne', 'Doe', 'example.fakerjs.dev', { allowSpecialCharacters: true }) // 'Jeanne%Doe88@example.fakerjs.dev'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.internet.email({ firstName, lastName, provider, ... })\` instead.
     */
    email(firstName?: string, lastName?: string, provider?: string, options?: {
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }): string;
    /**
     * Generates an email address using the given person's name as base.
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param options.provider The mail provider domain to use. If not specified, a random free mail provider will be chosen.
     * @param options.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     * @param legacyLastName The optional last name to use. If not specified, a random one will be chosen.
     * @param legacyProvider The mail provider domain to use. If not specified, a random free mail provider will be chosen.
     * @param legacyOptions The options to use. Defaults to \`{ allowSpecialCharacters: false }\`.
     * @param legacyOptions.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     *
     * @example
     * faker.internet.email() // 'Kassandra4@hotmail.com'
     * faker.internet.email({ firstName: 'Jeanne', lastName: 'Doe' }) // 'Jeanne63@yahoo.com'
     * faker.internet.email({ firstName: 'Jeanne', lastName: 'Doe', provider: 'example.fakerjs.dev' }) // 'Jeanne_Doe88@example.fakerjs.dev'
     * faker.internet.email({ firstName: 'Jeanne', lastName: 'Doe', provider: 'example.fakerjs.dev', allowSpecialCharacters: true }) // 'Jeanne%Doe88@example.fakerjs.dev'
     *
     * @since 2.0.1
     */
    email(options?: string | {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
      /**
       * The mail provider domain to use. If not specified, a random free mail provider will be chosen.
       */
      provider?: string;
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }, legacyLastName?: string, legacyProvider?: string, legacyOptions?: {
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }): string;
    /**
     * Generates an email address using an example mail provider using the given person's name as base.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param options.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     *
     * @example
     * faker.internet.exampleEmail() // 'Helmer.Graham23@example.com'
     * faker.internet.exampleEmail({ firstName: 'Jeanne', lastName: 'Doe' }) // 'Jeanne96@example.net'
     * faker.internet.exampleEmail({ firstName: 'Jeanne', lastName: 'Doe', allowSpecialCharacters: true }) // 'Jeanne%Doe88@example.com'
     *
     * @since 3.1.0
     */
    exampleEmail(options?: {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }): string;
    /**
     * Generates an email address using an example mail provider using the given person's name as base.
     *
     * @param firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param options The options to use. Defaults to \`{ allowSpecialCharacters: false }\`.
     * @param options.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     *
     * @example
     * faker.internet.exampleEmail() // 'Helmer.Graham23@example.com'
     * faker.internet.exampleEmail('Jeanne', 'Doe') // 'Jeanne96@example.net'
     * faker.internet.exampleEmail('Jeanne', 'Doe', { allowSpecialCharacters: true }) // 'Jeanne%Doe88@example.com'
     *
     * @since 3.1.0
     *
     * @deprecated Use \`faker.internet.exampleEmail({ firstName: lastName, ... })\` instead.
     */
    exampleEmail(firstName?: string, lastName?: string, options?: {
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }): string;
    /**
     * Generates an email address using an example mail provider using the given person's name as base.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param options.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     * @param legacyLastName The optional last name to use. If not specified, a random one will be chosen.
     * @param legacyOptions The options to use. Defaults to \`{}\`.
     * @param legacyOptions.allowSpecialCharacters Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included
     * in the email address. Defaults to \`false\`.
     *
     * @example
     * faker.internet.exampleEmail() // 'Helmer.Graham23@example.com'
     * faker.internet.exampleEmail({ firstName: 'Jeanne', lastName: 'Doe' }) // 'Jeanne96@example.net'
     * faker.internet.exampleEmail({ firstName: 'Jeanne', lastName: 'Doe', allowSpecialCharacters: true }) // 'Jeanne%Doe88@example.com'
     *
     * @since 3.1.0
     */
    exampleEmail(options?: string | {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }, legacyLastName?: string, legacyOptions?: {
      /**
       * Whether special characters such as \`\`.!#$%&'*+-/=?^_\`{|}~\`\` should be included in the email address.
       *
       * @default false
       */
      allowSpecialCharacters?: boolean;
    }): string;
    /**
     * Generates a username using the given person's name as base.
     * The resulting username may use neither, one or both of the names provided.
     * This will always return a plain ASCII string.
     * Some basic stripping of accents and transliteration of characters will be done.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     *
     * @see faker.internet.displayName()
     *
     * @example
     * faker.internet.userName() // 'Nettie_Zboncak40'
     * faker.internet.userName({ firstName: 'Jeanne', lastName: 'Doe'}) // 'Jeanne98' - note surname is not used
     * faker.internet.userName({ firstName: 'John', lastName: 'Doe' }) // 'John.Doe'
     * faker.internet.userName({ firstName: 'Hélene', lastName: 'Müller' }) // 'Helene_Muller11'
     * faker.internet.userName({ firstName: 'Фёдор', lastName: 'Достоевский' }) // 'Fedor.Dostoevskii50'
     * faker.internet.userName({ firstName: '大羽', lastName: '陳' }) // 'hlzp8d.tpv45' - note neither name is used
     *
     * @since 2.0.1
     */
    userName(options?: {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
    }): string;
    /**
     * Generates a username using the given person's name as base.
     * The resulting username may use neither, one or both of the names provided.
     * This will always return a plain ASCII string.
     * Some basic stripping of accents and transliteration of characters will be done.
     *
     * @param firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param lastName The optional last name to use. If not specified, a random one will be chosen.
     *
     * @see faker.internet.displayName()
     *
     * @example
     * faker.internet.userName() // 'Nettie_Zboncak40'
     * faker.internet.userName('Jeanne', 'Doe') // 'Jeanne98' - note surname is not used
     * faker.internet.userName('John', 'Doe') // 'John.Doe'
     * faker.internet.userName('Hélene', 'Müller') // 'Helene_Muller11'
     * faker.internet.userName('Фёдор', 'Достоевский') // 'Fedor.Dostoevskii50'
     * faker.internet.userName('大羽', '陳') // 'hlzp8d.tpv45' - note neither name is used
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.internet.userName({ firstName, lastName })\` instead.
     */
    userName(firstName?: string, lastName?: string): string;
    /**
     * Generates a username using the given person's name as base.
     * The resulting username may use neither, one or both of the names provided.
     * This will always return a plain ASCII string.
     * Some basic stripping of accents and transliteration of characters will be done.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param legacyLastName The optional last name to use. If not specified, a random one will be chosen.
     *
     * @see faker.internet.displayName()
     *
     * @example
     * faker.internet.userName() // 'Nettie_Zboncak40'
     * faker.internet.userName({ firstName: 'Jeanne', lastName: 'Doe'}) // 'Jeanne98' - note surname is not used
     * faker.internet.userName({ firstName: 'John', lastName: 'Doe' }) // 'John.Doe'
     * faker.internet.userName({ firstName: 'Hélene', lastName: 'Müller' }) // 'Helene_Muller11'
     * faker.internet.userName({ firstName: 'Фёдор', lastName: 'Достоевский' }) // 'Fedor.Dostoevskii50'
     * faker.internet.userName({ firstName: '大羽', lastName: '陳' }) // 'hlzp8d.tpv45' - note neither name is used
     *
     * @since 2.0.1
     */
    userName(options?: string | {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
    }, legacyLastName?: string): string;
    /**
     * Generates a display name using the given person's name as base.
     * The resulting display name may use one or both of the provided names.
     * If the input names include Unicode characters, the resulting display name will contain Unicode characters.
     * It will not contain spaces.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     *
     * @see faker.internet.userName()
     *
     * @example
     * faker.internet.displayName() // 'Nettie_Zboncak40'
     * faker.internet.displayName({ firstname 'Jeanne', lastName: 'Doe' }) // 'Jeanne98' - note surname not used.
     * faker.internet.displayName({ firstname 'John', lastName: 'Doe' }) // 'John.Doe'
     * faker.internet.displayName({ firstname 'Hélene', lastName: 'Müller' }) // 'Hélene_Müller11'
     * faker.internet.displayName({ firstname 'Фёдор', lastName: 'Достоевский' }) // 'Фёдор.Достоевский50'
     * faker.internet.displayName({ firstname '大羽', lastName: '陳' }) // '大羽.陳'
     *
     * @since 8.0.0
     */
    displayName(options?: {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
    }): string;
    /**
     * Generates a display name using the given person's name as base.
     * The resulting display name may use one or both of the provided names.
     * If the input names include Unicode characters, the resulting display name will contain Unicode characters.
     * It will not contain spaces.
     *
     * @param firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param lastName The optional last name to use. If not specified, a random one will be chosen.
     *
     * @see faker.internet.userName()
     *
     * @example
     * faker.internet.displayName() // 'Nettie_Zboncak40'
     * faker.internet.displayName('Jeanne', 'Doe') // 'Jeanne98' - note surname is not used
     * faker.internet.displayName('John', 'Doe') // 'John.Doe'
     * faker.internet.displayName('Hélene', 'Müller') // 'Hélene_Müller11'
     * faker.internet.displayName('Фёдор', 'Достоевский') // 'Фёдор.Достоевский50'
     * faker.internet.displayName('大羽', '陳') // '大羽.陳'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.internet.displayName({ firstName, lastName })\` instead.
     */
    displayName(firstName?: string, lastName?: string): string;
    /**
     * Generates a display name using the given person's name as base.
     * The resulting display name may use one or both of the provided names.
     * If the input names include Unicode characters, the resulting display name will contain Unicode characters.
     * It will not contain spaces.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified, a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified, a random one will be chosen.
     * @param legacyLastName The optional last name to use. If not specified, a random one will be chosen.
     *
     * @see faker.internet.userName()
     *
     * @example
     * faker.internet.displayName() // 'Nettie_Zboncak40'
     * faker.internet.displayName({ firstName: 'Jeanne', lastName: 'Doe'}) // 'Jeanne98' - note surname is not used
     * faker.internet.displayName({ firstName: 'John', lastName: 'Doe' }) // 'John.Doe'
     * faker.internet.displayName({ firstName: 'Hélene', lastName: 'Müller' }) // 'Hélene_Müller11'
     * faker.internet.displayName({ firstName: 'Фёдор', lastName: 'Достоевский' }) // 'Фёдор.Достоевский50'
     * faker.internet.displayName({ firstName: '大羽', lastName: '陳' }) // '大羽.陳'
     *
     * @since 8.0.0
     */
    displayName(options?: string | {
      /**
       * The optional first name to use.
       *
       * @default faker.person.firstName()
       */
      firstName?: string;
      /**
       * The optional last name to use.
       *
       * @default faker.person.lastName()
       */
      lastName?: string;
    }, legacyLastName?: string): string;
    /**
     * Returns a random web protocol. Either \`http\` or \`https\`.
     *
     * @example
     * faker.internet.protocol() // 'http'
     * faker.internet.protocol() // 'https'
     *
     * @since 2.1.5
     */
    protocol(): "http" | "https";
    /**
     * Returns a random http method.
     *
     * Can be either of the following:
     *
     * - \`GET\`
     * - \`POST\`
     * - \`PUT\`
     * - \`DELETE\`
     * - \`PATCH\`
     *
     * @example
     * faker.internet.httpMethod() // 'PATCH'
     *
     * @since 5.4.0
     */
    httpMethod(): "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    /**
     * Generates a random HTTP status code.
     *
     * @param options Options object.
     * @param options.types A list of the HTTP status code types that should be used.
     *
     * @example
     * faker.internet.httpStatusCode() // 200
     * faker.internet.httpStatusCode({ types: ['success', 'serverError'] }) // 500
     *
     * @since 7.0.0
     */
    httpStatusCode(options?: {
      /**
       * A list of the HTTP status code types that should be used.
       *
       * @default Object.keys(faker.definitions.internet.http_status_code)
       */
      types?: ReadonlyArray<HTTPStatusCodeType>;
    }): number;
    /**
     * Generates a random http(s) url.
     *
     * @param options Optional options object.
     * @param options.appendSlash Whether to append a slash to the end of the url (path). Defaults to a random boolean value.
     * @param options.protocol The protocol to use. Defaults to \`'https'\`.
     *
     * @example
     * faker.internet.url() // 'https://remarkable-hackwork.info'
     * faker.internet.url({ appendSlash: true }) // 'https://slow-timer.info/'
     * faker.internet.url({ protocol: 'http', appendSlash: false }) // 'http://www.terrible-idea.com'
     *
     * @since 2.1.5
     */
    url(options?: {
      /**
       * Whether to append a slash to the end of the url (path).
       *
       * @default faker.datatype.boolean()
       */
      appendSlash?: boolean;
      /**
       * The protocol to use.
       *
       * @default 'https'
       */
      protocol?: HTTPProtocolType;
    }): string;
    /**
     * Generates a random domain name.
     *
     * @example
     * faker.internet.domainName() // 'slow-timer.info'
     *
     * @since 2.0.1
     */
    domainName(): string;
    /**
     * Returns a random domain suffix.
     *
     * @example
     * faker.internet.domainSuffix() // 'com'
     * faker.internet.domainSuffix() // 'name'
     *
     * @since 2.0.1
     */
    domainSuffix(): string;
    /**
     * Generates a random domain word.
     *
     * @example
     * faker.internet.domainWord() // 'close-reality'
     * faker.internet.domainWord() // 'weird-cytoplasm'
     *
     * @since 2.0.1
     */
    domainWord(): string;
    /**
     * Generates a random IPv4 or IPv6 address.
     *
     * @example
     * faker.internet.ip() // '245.108.222.0'
     * faker.internet.ip() // '4e5:f9c5:4337:abfd:9caf:1135:41ad:d8d3'
     *
     * @since 2.0.1
     */
    ip(): string;
    /**
     * Generates a random IPv4 address.
     *
     * @example
     * faker.internet.ipv4() // '245.108.222.0'
     *
     * @since 6.1.1
     */
    ipv4(): string;
    /**
     * Generates a random IPv6 address.
     *
     * @example
     * faker.internet.ipv6() // '269f:1230:73e3:318d:842b:daab:326d:897b'
     *
     * @since 4.0.0
     */
    ipv6(): string;
    /**
     * Generates a random port number.
     *
     * @example
     * faker.internet.port() // '9414'
     *
     * @since 5.4.0
     */
    port(): number;
    /**
     * Generates a random user agent string.
     *
     * @example
     * faker.internet.userAgent()
     * // 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_8_8)  AppleWebKit/536.0.2 (KHTML, like Gecko) Chrome/27.0.849.0 Safari/536.0.2'
     *
     * @since 2.0.1
     */
    userAgent(): string;
    /**
     * Generates a random css hex color code in aesthetically pleasing color palette.
     *
     * Based on
     * http://stackoverflow.com/questions/43044/algorithm-to-randomly-generate-an-aesthetically-pleasing-color-palette
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.redBase The optional base red in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param options.greenBase The optional base green in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param options.blueBase The optional base blue in range between \`0\` and \`255\`. Defaults to \`0\`.
     *
     * @example
     * faker.internet.color() // '#30686e'
     * faker.internet.color({ redBase: 100, greenBase: 100, blueBase: 100 }) // '#4e5f8b'
     *
     * @since 2.0.1
     */
    color(options?: {
      /**
       * The optional base red in range between \`0\` and \`255\`.
       *
       * @default 0
       */
      redBase?: number;
      /**
       * The optional base green in range between \`0\` and \`255\`.
       *
       * @default 0
       */
      greenBase?: number;
      /**
       * The optional base blue in range between \`0\` and \`255\`.
       *
       * @default 0
       */
      blueBase?: number;
    }): string;
    /**
     * Generates a random css hex color code in aesthetically pleasing color palette.
     *
     * Based on
     * http://stackoverflow.com/questions/43044/algorithm-to-randomly-generate-an-aesthetically-pleasing-color-palette
     *
     * @param redBase The optional base red in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param greenBase The optional base green in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param blueBase The optional base blue in range between \`0\` and \`255\`. Defaults to \`0\`.
     *
     * @example
     * faker.internet.color() // '#30686e'
     * faker.internet.color(100, 100, 100) // '#4e5f8b'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.internet.color({ redbase, greenBase, blueBase })\` instead.
     */
    color(redBase?: number, greenBase?: number, blueBase?: number): string;
    /**
     * Generates a random css hex color code in aesthetically pleasing color palette.
     *
     * Based on
     * http://stackoverflow.com/questions/43044/algorithm-to-randomly-generate-an-aesthetically-pleasing-color-palette
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.redBase The optional base red in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param options.greenBase The optional base green in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param options.blueBase The optional base blue in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param legacyGreenBase The optional base green in range between \`0\` and \`255\`. Defaults to \`0\`.
     * @param legacyBlueBase The optional base blue in range between \`0\` and \`255\`. Defaults to \`0\`.
     *
     * @example
     * faker.internet.color() // '#30686e'
     * faker.internet.color({ redBase: 100, greenBase: 100, blueBase: 100 }) // '#4e5f8b'
     *
     * @since 2.0.1
     */
    color(options?: number | {
      /**
       * The optional base red in range between \`0\` and \`255\`.
       *
       * @default 0
       */
      redBase?: number;
      /**
       * The optional base green in range between \`0\` and \`255\`.
       *
       * @default 0
       */
      greenBase?: number;
      /**
       * The optional base blue in range between \`0\` and \`255\`.
       *
       * @default 0
       */
      blueBase?: number;
    }, legacyGreenBase?: number, legacyBlueBase?: number): string;
    /**
     * Generates a random mac address.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param separator The optional separator to use. Can be either \`':'\`, \`'-'\` or \`''\`. Defaults to \`':'\`.
     *
     * @example
     * faker.internet.mac() // '32:8e:2e:09:c6:05'
     *
     * @since 3.0.0
     */
    mac(options?: {
      /**
       * The optional separator to use. Can be either \`':'\`, \`'-'\` or \`''\`.
       *
       * @default ':'
       */
      separator?: string;
    }): string;
    /**
     * Generates a random mac address.
     *
     * @param sep The optional separator to use. Can be either \`':'\`, \`'-'\` or \`''\`. Defaults to \`':'\`.
     *
     * @example
     * faker.internet.mac() // '32:8e:2e:09:c6:05'
     *
     * @since 3.0.0
     */
    mac(sep?: string): string;
    /**
     * Generates a random mac address.
     *
     * @param options The optional separator or an options object. Defaults to \`{}\`.
     * @param separator The optional separator to use. Can be either \`':'\`, \`'-'\` or \`''\`. Defaults to \`':'\`.
     *
     * @example
     * faker.internet.mac() // '32:8e:2e:09:c6:05'
     *
     * @since 3.0.0
     */
    mac(options?: string | {
      /**
       * The optional separator to use. Can be either \`':'\`, \`'-'\` or \`''\`.
       *
       * @default ':'
       */
      separator?: string;
    }): string;
    /**
     * Generates a random password-like string. Do not use this method for generating actual passwords for users.
     * Since the source of the randomness is not cryptographically secure, neither is this generator.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.length The length of the password to generate. Defaults to \`15\`.
     * @param options.memorable Whether the generated password should be memorable. Defaults to \`false\`.
     * @param options.pattern The pattern that all chars should match.
     * This option will be ignored, if \`memorable\` is \`true\`. Defaults to \`/\w/\`.
     * @param options.prefix The prefix to use. Defaults to \`''\`.
     *
     * @example
     * faker.internet.password() // '89G1wJuBLbGziIs'
     * faker.internet.password({ length: 20 }) // 'aF55c_8O9kZaPOrysFB_'
     * faker.internet.password({ length: 20, memorable: true }) // 'lawetimufozujosodedi'
     * faker.internet.password({ length: 20, memorable: true, pattern: /[A-Z]/ }) // 'HMAQDFFYLDDUTBKVNFVS'
     * faker.internet.password({ length: 20, memorable: true, pattern: /[A-Z]/, prefix: 'Hello ' }) // 'Hello IREOXTDWPERQSB'
     *
     * @since 2.0.1
     */
    password(options?: {
      /**
       * The length of the password to generate.
       *
       * @default 15
       */
      length?: number;
      /**
       * Whether the generated password should be memorable.
       *
       * @default false
       */
      memorable?: boolean;
      /**
       * The pattern that all chars should match.
       * This option will be ignored, if \`memorable\` is \`true\`.
       *
       * @default /\w/
       */
      pattern?: RegExp;
      /**
       * The prefix to use.
       *
       * @default ''
       */
      prefix?: string;
    }): string;
    /**
     * Generates a random password.
     *
     * @param len The length of the password to generate. Defaults to \`15\`.
     * @param memorable Whether the generated password should be memorable. Defaults to \`false\`.
     * @param pattern The pattern that all chars should match.
     * This option will be ignored, if \`memorable\` is \`true\`. Defaults to \`/\w/\`.
     * @param prefix The prefix to use. Defaults to \`''\`.
     *
     * @example
     * faker.internet.password() // '89G1wJuBLbGziIs'
     * faker.internet.password(20) // 'aF55c_8O9kZaPOrysFB_'
     * faker.internet.password(20, true) // 'lawetimufozujosodedi'
     * faker.internet.password(20, true, /[A-Z]/) // 'HMAQDFFYLDDUTBKVNFVS'
     * faker.internet.password(20, true, /[A-Z]/, 'Hello ') // 'Hello IREOXTDWPERQSB'
     *
     * @since 2.0.1
     *
     * @deprecated Use \`faker.internet({ length, memorable, pattern, prefix })\` instead.
     */
    password(len?: number, memorable?: boolean, pattern?: RegExp, prefix?: string): string;
    /**
     * Generates a random password.
     *
     * @param options The length of the password or an options object. Defaults to \`{}\`.
     * @param options.length The length of the password to generate. Defaults to \`15\`.
     * @param options.memorable Whether the generated password should be memorable. Defaults to \`false\`.
     * @param options.pattern The pattern that all chars should match.
     * This option will be ignored, if \`memorable\` is \`true\`. Defaults to \`/\w/\`.
     * @param options.prefix The prefix to use. Defaults to \`''\`.
     * @param legacyMemorable Whether the generated password should be memorable. Defaults to \`false\`.
     * @param legacyPattern The pattern that all chars should match.
     * This option will be ignored, if \`memorable\` is \`true\`. Defaults to \`/\w/\`.
     * @param legacyPrefix The prefix to use. Defaults to \`''\`.
     *
     * @example
     * faker.internet.password() // '89G1wJuBLbGziIs'
     * faker.internet.password({ length: 20 }) // 'aF55c_8O9kZaPOrysFB_'
     * faker.internet.password({ length: 20, memorable: true }) // 'lawetimufozujosodedi'
     * faker.internet.password({ length: 20, memorable: true, pattern: /[A-Z]/ }) // 'HMAQDFFYLDDUTBKVNFVS'
     * faker.internet.password({ length: 20, memorable: true, pattern: /[A-Z]/, prefix: 'Hello ' }) // 'Hello IREOXTDWPERQSB'
     *
     * @since 2.0.1
     */
    password(options?: number | {
      /**
       * The length of the password to generate.
       *
       * @default 15
       */
      length?: number;
      /**
       * Whether the generated password should be memorable.
       *
       * @default false
       */
      memorable?: boolean;
      /**
       * The pattern that all chars should match.
       * This option will be ignored, if \`memorable\` is \`true\`.
       *
       * @default /\w/
       */
      pattern?: RegExp;
      /**
       * The prefix to use.
       *
       * @default ''
       */
      prefix?: string;
    }, legacyMemorable?: boolean, legacyPattern?: RegExp, legacyPrefix?: string): string;
    /**
     * Generates a random emoji.
     *
     * @param options Options object.
     * @param options.types A list of the emoji types that should be included. Possible values are \`'smiley'\`, \`'body'\`, \`'person'\`, \`'nature'\`, \`'food'\`, \`'travel'\`, \`'activity'\`, \`'object'\`, \`'symbol'\`, \`'flag'\`. By default, emojis from any type will be included.
     *
     * @example
     * faker.internet.emoji() // '🥰'
     * faker.internet.emoji({ types: ['food', 'nature'] }) // '🥐'
     *
     * @since 6.2.0
     */
    emoji(options?: {
      /**
       * A list of the emoji types that should be used.
       *
       * @default Object.keys(faker.definitions.internet.emoji)
       */
      types?: ReadonlyArray<EmojiType>;
    }): string;
  }
  declare class LocationModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates random zip code from specified format. If format is not specified,
     * the locale's zip format is used.
     *
     * @param options The format used to generate the zip code or an options object. Defaults to \`{}\`.
     * @param options.state The state to generate the zip code for.
     * If the current locale does not have a corresponding \`postcode_by_state\` definition, an error is thrown.
     * @param options.format The optional format used to generate the zip code.
     * By default, a random format is used from the locale zip formats.
     * This won't be used if the state option is specified.
     *
     * @see faker.helpers.replaceSymbols()
     *
     * @example
     * faker.location.zipCode() // '17839'
     * faker.location.zipCode('####') // '6925'
     *
     * @since 8.0.0
     */
    zipCode(options?: string | {
      /**
       * The state to generate the zip code for.
       *
       * If the current locale does not have a corresponding \`postcode_by_state\` definition, an error is thrown.
       */
      state?: string;
      /**
       * The optional format used to generate the zip code.
       *
       * This won't be used if the state option is specified.
       *
       * @default faker.definitions.location.postcode
       */
      format?: string;
    }): string;
    /**
     * Generates random zip code from state abbreviation.
     *
     * If the current locale does not have a corresponding \`postcode_by_state\` definition, an error is thrown.
     *
     * @param options A state abbreviation or an options object. Defaults to \`{}\`.
     * @param options.state The abbreviation of the state to generate the zip code for.
     * If not specified, a random zip code is generated according to the locale's zip format.
     *
     * @see faker.location.zipCode()
     *
     * @example
     * fakerEN_US.location.zipCodeByState("AK") // '99595'
     * fakerEN_US.location.zipCodeByState() // '47683-9880'
     * fakerEN_US.location.zipCodeByState({ state: "AK" }) // '99595'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.zipCode({ state })\` instead.
     */
    zipCodeByState(options?: string | {
      /**
       * The abbreviation of the state to generate the zip code for.
       * If not specified, a random zip code is generated according to the locale's zip format.
       */
      state?: string;
    }): string;
    /**
     * Generates a random localized city name.
     *
     * @example
     * faker.location.city() // 'East Jarretmouth'
     * fakerDE.location.city() // 'Bad Lilianadorf'
     *
     * @since 8.0.0
     */
    city(): string;
    /**
     * Returns a random city name from a list of real cities for the locale.
     *
     * @see faker.location.city()
     *
     * @example
     * faker.location.cityName() // 'San Rafael'
     * fakerDE.location.cityName() // 'Nürnberg'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.city()\` instead.
     */
    cityName(): string;
    /**
     * Generates a random building number.
     *
     * @example
     * faker.location.buildingNumber() // '379'
     *
     * @since 8.0.0
     */
    buildingNumber(): string;
    /**
     * Generates a random localized street name.
     *
     * @example
     * faker.location.street() // 'Schroeder Isle'
     *
     * @since 8.0.0
     */
    street(): string;
    /**
     * Returns a random localized street name.
     *
     * @see faker.location.street()
     *
     * @example
     * fakerDE.location.streetName() // 'Cavill Avenue'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.street()\` instead.
     */
    streetName(): string;
    /**
     * Generates a random localized street address.
     *
     * @param options Whether to use a full address or an options object. Defaults to \`{}\`.
     * @param options.useFullAddress When true this will generate a full address.
     * Otherwise it will just generate a street address.
     *
     * @example
     * faker.location.streetAddress() // '0917 O'Conner Estates'
     * faker.location.streetAddress(false) // '34830 Erdman Hollow'
     * faker.location.streetAddress(true) // '3393 Ronny Way Apt. 742'
     * faker.location.streetAddress({ useFullAddress: true }) // '7917 Miller Park Apt. 410'
     *
     * @since 8.0.0
     */
    streetAddress(options?: boolean | {
      /**
       * When true this will generate a full address.
       * Otherwise it will just generate a street address.
       */
      useFullAddress?: boolean;
    }): string;
    /**
     * Generates a random localized secondary address. This refers to a specific location at a given address
     * such as an apartment or room number.
     *
     * @example
     * faker.location.secondaryAddress() // 'Apt. 861'
     *
     * @since 8.0.0
     */
    secondaryAddress(): string;
    /**
     * Returns a random localized county, or other equivalent second-level administrative entity for the locale's country such as a district or department.
     *
     * @example
     * fakerEN_GB.location.county() // 'Cambridgeshire'
     * fakerEN_US.location.county() // 'Monroe County'
     *
     * @since 8.0.0
     */
    county(): string;
    /**
     * Returns a random country name.
     *
     * @example
     * faker.location.country() // 'Greece'
     *
     * @since 8.0.0
     */
    country(): string;
    /**
     * Returns a random [ISO_3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) country code.
     *
     * @param options The code to return or an options object. Defaults to \`{}\`.
     * @param options.variant The variant to return. Can be either \`'alpha-2'\` (two-letter code)
     * or \`'alpha-3'\` (three-letter code). Defaults to \`'alpha-2'\`.
     *
     * @example
     * faker.location.countryCode() // 'SJ'
     * faker.location.countryCode('alpha-2') // 'GA'
     * faker.location.countryCode('alpha-3') // 'TJK'
     *
     * @since 8.0.0
     */
    countryCode(options?: "alpha-2" | "alpha-3" | {
      /**
       * The code to return.
       * Can be either \`'alpha-2'\` (two-letter code)
       * or \`'alpha-3'\` (three-letter code).
       *
       * @default 'alpha-2'
       */
      variant?: "alpha-2" | "alpha-3";
    }): string;
    /**
     * Returns a random localized state, or other equivalent first-level administrative entity for the locale's country such as a province or region.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated first-level administrative entity names.
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.state() // 'Mississippi'
     * fakerEN_CA.location.state() // 'Saskatchewan'
     * fakerDE.location.state() // 'Nordrhein-Westfalen'
     * faker.location.state({ abbreviated: true }) // 'LA'
     *
     * @since 8.0.0
     */
    state(options?: {
      /**
       * If true this will return abbreviated first-level administrative entity names.
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Returns a random localized state's abbreviated name from this country.
     *
     * @example
     * faker.location.stateAbbr() // 'ND'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.state({ abbreviated: true })\` instead.
     */
    stateAbbr(): string;
    /**
     * Generates a random latitude.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.max The upper bound for the latitude to generate. Defaults to \`90\`.
     * @param options.min The lower bound for the latitude to generate. Defaults to \`-90\`.
     * @param options.precision The number of decimal points of precision for the latitude. Defaults to \`4\`.
     *
     * @example
     * faker.location.latitude() // -30.9501
     * faker.location.latitude({ max: 10 }) // 5.7225
     * faker.location.latitude({ max: 10, min: -10 }) // -9.6273
     * faker.location.latitude({ max: 10, min: -10, precision: 5 }) // 2.68452
     *
     * @since 8.0.0
     */
    latitude(options?: {
      /**
       * The upper bound for the latitude to generate.
       *
       * @default 90
       */
      max?: number;
      /**
       * The lower bound for the latitude to generate.
       *
       * @default -90
       */
      min?: number;
      /**
       * The number of decimal points of precision for the latitude.
       *
       * @default 4
       */
      precision?: number;
    }): number;
    /**
     * Generates a random latitude.
     *
     * @param max The upper bound for the latitude to generate. Defaults to \`90\`.
     * @param min The lower bound for the latitude to generate. Defaults to \`-90\`.
     * @param precision The number of decimal points of precision for the latitude. Defaults to \`4\`.
     *
     * @example
     * faker.location.latitude() // -30.9501
     * faker.location.latitude(10) // 5.7225
     * faker.location.latitude(10, -10) // -9.6273
     * faker.location.latitude(10, -10, 5) // 2.68452
     *
     * @since 8.0.0
     */
    latitude(max?: number, min?: number, precision?: number): number;
    /**
     * Generates a random latitude.
     *
     * @param options The upper bound for the latitude or an options object. Defaults to \`{}\`.
     * @param options.max The upper bound for the latitude to generate. Defaults to \`90\`.
     * @param options.min The lower bound for the latitude to generate. Defaults to \`-90\`.
     * @param options.precision The number of decimal points of precision for the latitude. Defaults to \`4\`.
     * @param legacyMin The lower bound for the latitude to generate. Defaults to \`-90\`.
     * @param legacyPrecision The number of decimal points of precision for the latitude. Defaults to \`4\`.
     *
     * @example
     * faker.location.latitude() // -30.9501
     * faker.location.latitude({ max: 10 }) // 5.7225
     * faker.location.latitude({ max: 10, min: -10 }) // -9.6273
     * faker.location.latitude({ max: 10, min: -10, precision: 5 }) // 2.68452
     * faker.location.latitude(10) // 5.7225
     * faker.location.latitude(10, -10) // -9.6273
     * faker.location.latitude(10, -10, 5) // 2.68452
     *
     * @since 8.0.0
     */
    latitude(options: number | {
      /**
       * The upper bound for the latitude to generate.
       *
       * @default 90
       */
      max?: number;
      /**
       * The lower bound for the latitude to generate.
       *
       * @default -90
       */
      min?: number;
      /**
       * The number of decimal points of precision for the latitude.
       *
       * @default 4
       */
      precision?: number;
    }, legacyMin?: number, legacyPrecision?: number): number;
    /**
     * Generates a random longitude.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.max The upper bound for the longitude to generate. Defaults to \`180\`.
     * @param options.min The lower bound for the longitude to generate. Defaults to \`-180\`.
     * @param options.precision The number of decimal points of precision for the longitude. Defaults to \`4\`.
     *
     * @example
     * faker.location.longitude() // -30.9501
     * faker.location.longitude({ max: 10 }) // 5.7225
     * faker.location.longitude({ max: 10, min: -10 }) // -9.6273
     * faker.location.longitude({ max: 10, min: -10, precision: 5 }) // 2.68452
     *
     * @since 8.0.0
     */
    longitude(options?: {
      /**
       * The upper bound for the latitude to generate.
       *
       * @default 90
       */
      max?: number;
      /**
       * The lower bound for the latitude to generate.
       *
       * @default -90
       */
      min?: number;
      /**
       * The number of decimal points of precision for the latitude.
       *
       * @default 4
       */
      precision?: number;
    }): number;
    /**
     * Generates a random longitude.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.max The upper bound for the longitude to generate. Defaults to \`180\`.
     * @param options.min The lower bound for the longitude to generate. Defaults to \`-180\`.
     * @param options.precision The number of decimal points of precision for the longitude. Defaults to \`4\`.
     *
     * @example
     * faker.location.longitude() // -30.9501
     * faker.location.longitude({ max: 10 }) // 5.7225
     * faker.location.longitude({ max: 10, min: -10 }) // -9.6273
     * faker.location.longitude({ max: 10, min: -10, precision: 5 }) // 2.68452
     *
     * @since 8.0.0
     */
    longitude(max?: number, min?: number, precision?: number): number;
    /**
     * Generates a random longitude.
     *
     * @param options The upper bound for the longitude or an options object. Defaults to \`{}\`.
     * @param options.max The upper bound for the longitude to generate. Defaults to \`180\`.
     * @param options.min The lower bound for the longitude to generate. Defaults to \`-180\`.
     * @param options.precision The number of decimal points of precision for the longitude. Defaults to \`4\`.
     * @param legacyMin The lower bound for the longitude to generate. Defaults to \`-180\`.
     * @param legacyPrecision The number of decimal points of precision for the longitude. Defaults to \`4\`.
     *
     * @example
     * faker.location.longitude() // -30.9501
     * faker.location.longitude({ max: 10 }) // 5.7225
     * faker.location.longitude({ max: 10, min: -10 }) // -9.6273
     * faker.location.longitude({ max: 10, min: -10, precision: 5 }) // 2.68452
     *
     * @since 8.0.0
     */
    longitude(options?: number | {
      /**
       * The upper bound for the longitude to generate.
       *
       * @default 180
       */
      max?: number;
      /**
       * The lower bound for the longitude to generate.
       *
       * @default -180
       */
      min?: number;
      /**
       * The number of decimal points of precision for the longitude.
       *
       * @default 4
       */
      precision?: number;
    }, legacyMin?: number, legacyPrecision?: number): number;
    /**
     * Returns a random direction (cardinal and ordinal; northwest, east, etc).
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (NW, E, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.direction() // 'Northeast'
     * faker.location.direction({ abbreviated: true }) // 'SW'
     *
     * @since 8.0.0
     */
    direction(options?: {
      /**
       * If true this will return abbreviated directions (NW, E, etc).
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Returns a random direction (cardinal and ordinal; northwest, east, etc).
     *
     * @param abbreviated If true this will return abbreviated directions (NW, E, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.direction() // 'Northeast'
     * faker.location.direction(false) // 'South'
     * faker.location.direction(true) // 'NE'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.direction({ abbreviated })\` instead.
     */
    direction(abbreviated?: boolean): string;
    /**
     * Returns a random direction (cardinal and ordinal; northwest, east, etc).
     *
     * @param options Whether to use abbreviated or an options object. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (NW, E, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.direction() // 'Northeast'
     * faker.location.direction({ abbreviated: true }) // 'SW'
     *
     * @since 8.0.0
     */
    direction(options?: boolean | {
      /**
       * If true this will return abbreviated directions (NW, E, etc).
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Returns a random cardinal direction (north, east, south, west).
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (N, E, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.cardinalDirection() // 'North'
     * faker.location.cardinalDirection({ abbreviated: true }) // 'W'
     *
     * @since 8.0.0
     */
    cardinalDirection(options?: {
      /**
       * If true this will return abbreviated directions (N, E, etc).
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Returns a random cardinal direction (north, east, south, west).
     *
     * @param abbreviated If true this will return abbreviated directions (N, E, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.cardinalDirection() // 'North'
     * faker.location.cardinalDirection(false) // 'South'
     * faker.location.cardinalDirection(true) // 'N'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.cardinalDirection({ abbreviated })\` instead.
     */
    cardinalDirection(abbreviated?: boolean): string;
    /**
     * Returns a random cardinal direction (north, east, south, west).
     *
     * @param options Whether to use abbreviated or an options object. Defaults to\`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (N, E, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.cardinalDirection() // 'North'
     * faker.location.cardinalDirection({ abbreviated: true }) // 'W'
     *
     * @since 8.0.0
     */
    cardinalDirection(options?: boolean | {
      /**
       * If true this will return abbreviated directions (N, E, etc).
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Returns a random ordinal direction (northwest, southeast, etc).
     *
     * @param options Whether to use abbreviated or an options object. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (NW, SE, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.ordinalDirection() // 'Northeast'
     * faker.location.ordinalDirection({ abbreviated: true }) // 'SW'
     *
     * @since 8.0.0
     */
    ordinalDirection(options?: {
      /**
       * If true this will return abbreviated directions (NW, SE, etc).
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Returns a random ordinal direction (northwest, southeast, etc).
     *
     * @param options Whether to use abbreviated or an options object. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (NW, SE, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.ordinalDirection() // 'Northeast'
     * faker.location.ordinalDirection(false) // 'Northwest'
     * faker.location.ordinalDirection(true) // 'NE'
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.ordinalDirection({ abbreviated })\` instead.
     */
    ordinalDirection(abbreviated?: boolean): string;
    /**
     * Returns a random ordinal direction (northwest, southeast, etc).
     *
     * @param options Whether to use abbreviated or an options object. Defaults to \`{}\`.
     * @param options.abbreviated If true this will return abbreviated directions (NW, SE, etc).
     * Otherwise this will return the long name. Defaults to \`false\`.
     *
     * @example
     * faker.location.ordinalDirection() // 'Northeast'
     * faker.location.ordinalDirection({ abbreviated: true }) // 'SW'
     *
     * @since 8.0.0
     */
    ordinalDirection(options?: boolean | {
      /**
       * If true this will return abbreviated directions (NW, SE, etc).
       * Otherwise this will return the long name.
       *
       * @default false
       */
      abbreviated?: boolean;
    }): string;
    /**
     * Generates a random GPS coordinate within the specified radius from the given coordinate.
     *
     * @param options The options for generating a GPS coordinate.
     * @param options.origin The original coordinate to get a new coordinate close to.
     * If no coordinate is given, a random one will be chosen.
     * @param options.radius The maximum distance from the given coordinate to the new coordinate. Defaults to \`10\`.
     * @param options.isMetric If \`true\` assume the radius to be in kilometers. If \`false\` for miles. Defaults to \`false\`.
     *
     * @example
     * faker.location.nearbyGPSCoordinate() // [ 33.8475, -170.5953 ]
     * faker.location.nearbyGPSCoordinate({ origin: [33, -170] }) // [ 33.0165, -170.0636 ]
     * faker.location.nearbyGPSCoordinate({ origin: [33, -170], radius: 1000, isMetric: true }) // [ 37.9163, -179.2408 ]
     *
     * @since 8.0.0
     */
    nearbyGPSCoordinate(options?: {
      origin?: [
        latitude: number,
        longitude: number
      ];
      radius?: number;
      isMetric?: boolean;
    }): [
      latitude: number,
      longitude: number
    ];
    /**
     * Generates a random GPS coordinate within the specified radius from the given coordinate.
     *
     * @param coordinate The original coordinate to get a new coordinate close to.
     * If no coordinate is given, a random one will be chosen.
     * @param radius The maximum distance from the given coordinate to the new coordinate. Defaults to \`10\`.
     * @param isMetric If \`true\` assume the radius to be in kilometers. If \`false\` for miles. Defaults to \`false\`.
     *
     * @example
     * faker.location.nearbyGPSCoordinate() // [ 33.8475, -170.5953 ]
     * faker.location.nearbyGPSCoordinate([33, -170]) // [ 33.0165, -170.0636 ]
     * faker.location.nearbyGPSCoordinate([33, -170], 1000, true) // [ 37.9163, -179.2408 ]
     *
     * @since 8.0.0
     *
     * @deprecated Use \`faker.location.nearbyGPSCoordinate({ origin, radius, isMetric })\` instead.
     */
    nearbyGPSCoordinate(coordinate?: [
      latitude: number,
      longitude: number
    ], radius?: number, isMetric?: boolean): [
      latitude: number,
      longitude: number
    ];
    /**
     * Generates a random GPS coordinate within the specified radius from the given coordinate.
     *
     * @param options The options for generating a GPS coordinate.
     * @param options.origin The original coordinate to get a new coordinate close to.
     * If no coordinate is given, a random one will be chosen.
     * @param options.radius The maximum distance from the given coordinate to the new coordinate. Defaults to \`10\`.
     * @param options.isMetric If \`true\` assume the radius to be in kilometers. If \`false\` for miles. Defaults to \`false\`.
     * @param legacyRadius Deprecated, use \`options.radius\` instead.
     * @param legacyIsMetric Deprecated, use \`options.isMetric\` instead.
     *
     * @example
     * faker.location.nearbyGPSCoordinate() // [ 33.8475, -170.5953 ]
     * faker.location.nearbyGPSCoordinate({ origin: [33, -170] }) // [ 33.0165, -170.0636 ]
     * faker.location.nearbyGPSCoordinate({ origin: [33, -170], radius: 1000, isMetric: true }) // [ 37.9163, -179.2408 ]
     *
     * @since 8.0.0
     */
    nearbyGPSCoordinate(options?: [
      latitude: number,
      longitude: number
    ] | {
      origin?: [
        latitude: number,
        longitude: number
      ];
      radius?: number;
      isMetric?: boolean;
    }, legacyRadius?: number, legacyIsMetric?: boolean): [
      latitude: number,
      longitude: number
    ];
    /**
     * Returns a random time zone.
     *
     * @example
     * faker.location.timeZone() // 'Pacific/Guam'
     *
     * @since 8.0.0
     */
    timeZone(): string;
  }
  declare class LoremModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a word of a specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.lorem.word() // 'temporibus'
     * faker.lorem.word(5) // 'velit'
     * faker.lorem.word({ strategy: 'shortest' }) // 'a'
     * faker.lorem.word({ length: { min: 5, max: 7 }, strategy: 'fail' }) // 'quaerat'
     *
     * @since 3.1.0
     */
    word(options?: number | {
      /**
       * The expected length of the word.
       *
       * @default 1
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Generates a space separated list of words.
     *
     * @param wordCount The number of words to generate. Defaults to \`3\`.
     * @param wordCount.min The minimum number of words to generate.
     * @param wordCount.max The maximum number of words to generate.
     *
     * @example
     * faker.lorem.words() // 'qui praesentium pariatur'
     * faker.lorem.words(10) // 'debitis consectetur voluptatem non doloremque ipsum autem totam eum ratione'
     * faker.lorem.words({ min: 1, max: 3 }) // 'tenetur error cum'
     *
     * @since 2.0.1
     */
    words(wordCount?: number | {
      /**
       * The minimum number of words to generate.
       */
      min: number;
      /**
       * The maximum number of words to generate.
       */
      max: number;
    }): string;
    /**
     * Generates a space separated list of words beginning with a capital letter and ending with a period.
     *
     * @param wordCount The number of words, that should be in the sentence. Defaults to a random number between \`3\` and \`10\`.
     * @param wordCount.min The minimum number of words to generate. Defaults to \`3\`.
     * @param wordCount.max The maximum number of words to generate. Defaults to \`10\`.
     *
     * @example
     * faker.lorem.sentence() // 'Voluptatum cupiditate suscipit autem eveniet aut dolorem aut officiis distinctio.'
     * faker.lorem.sentence(5) // 'Laborum voluptatem officiis est et.'
     * faker.lorem.sentence({ min: 3, max: 5 }) // 'Fugiat repellendus nisi.'
     *
     * @since 2.0.1
     */
    sentence(wordCount?: number | {
      /**
       * The minimum number of words to generate.
       */
      min: number;
      /**
       * The maximum number of words to generate.
       */
      max: number;
    }): string;
    /**
     * Generates a slugified text consisting of the given number of hyphen separated words.
     *
     * @param wordCount The number of words to generate. Defaults to \`3\`.
     * @param wordCount.min The minimum number of words to generate.
     * @param wordCount.max The maximum number of words to generate.
     *
     * @example
     * faker.lorem.slug() // 'dolores-illo-est'
     * faker.lorem.slug(5) // 'delectus-totam-iusto-itaque-placeat'
     * faker.lorem.slug({ min: 1, max: 3 }) // 'illo-ratione'
     *
     * @since 4.0.0
     */
    slug(wordCount?: number | {
      /**
       * The minimum number of words to generate.
       */
      min: number;
      /**
       * The maximum number of words to generate.
       */
      max: number;
    }): string;
    /**
     * Generates the given number of sentences.
     *
     * @param sentenceCount The number of sentences to generate. Defaults to a random number between \`2\` and \`6\`.
     * @param sentenceCount.min The minimum number of sentences to generate. Defaults to \`2\`.
     * @param sentenceCount.max The maximum number of sentences to generate. Defaults to \`6\`.
     * @param separator The separator to add between sentences. Defaults to \`' '\`.
     *
     * @example
     * faker.lorem.sentences() // 'Iste molestiae incidunt aliquam possimus reprehenderit eum corrupti. Deleniti modi voluptatem nostrum ut esse.'
     * faker.lorem.sentences(2) // 'Maxime vel numquam quibusdam. Dignissimos ex molestias quos aut molestiae quam nihil occaecati maiores.'
     * faker.lorem.sentences(2, '\n')
     * // 'Et rerum a unde tempora magnam sit nisi.
     * // Et perspiciatis ipsam omnis.'
     * faker.lorem.sentences({ min: 1, max: 3 }) // 'Placeat ex natus tenetur repellendus repellendus iste. Optio nostrum veritatis.'
     *
     * @since 2.0.1
     */
    sentences(sentenceCount?: number | {
      /**
       * The minimum number of sentences to generate.
       */
      min: number;
      /**
       * The maximum number of sentences to generate.
       */
      max: number;
    }, separator?: string): string;
    /**
     * Generates a paragraph with the given number of sentences.
     *
     * @param sentenceCount The number of sentences to generate. Defaults to \`3\`.
     * @param sentenceCount.min The minimum number of sentences to generate.
     * @param sentenceCount.max The maximum number of sentences to generate.
     *
     * @example
     * faker.lorem.paragraph() // 'Non architecto nam unde sint. Ex tenetur dolor facere optio aut consequatur. Ea laudantium reiciendis repellendus.'
     * faker.lorem.paragraph(2) // 'Animi possimus nemo consequuntur ut ea et tempore unde qui. Quis corporis esse occaecati.'
     * faker.lorem.paragraph({ min: 1, max: 3 }) // 'Quis doloribus necessitatibus sint. Rerum accusamus impedit corporis porro.'
     *
     * @since 2.0.1
     */
    paragraph(sentenceCount?: number | {
      /**
       * The minimum number of sentences to generate.
       */
      min: number;
      /**
       * The maximum number of sentences to generate.
       */
      max: number;
    }): string;
    /**
     * Generates the given number of paragraphs.
     *
     * @param paragraphCount The number of paragraphs to generate. Defaults to \`3\`.
     * @param paragraphCount.min The minimum number of paragraphs to generate.
     * @param paragraphCount.max The maximum number of paragraphs to generate.
     * @param separator The separator to use. Defaults to \`'\n'\`.
     *
     * @example
     * faker.lorem.paragraphs()
     * // 'Beatae voluptatem dicta et assumenda fugit eaque quidem consequatur. Fuga unde provident. Id reprehenderit soluta facilis est laborum laborum. Illum aut non ut. Est nulla rem ipsa.
     * // Voluptatibus quo pariatur est. Temporibus deleniti occaecati pariatur nemo est molestias voluptas. Doloribus commodi et et exercitationem vel et. Omnis inventore cum aut amet.
     * // Sapiente deleniti et. Ducimus maiores eum. Rem dolorem itaque aliquam.'
     *
     * faker.lorem.paragraphs(5)
     * // 'Quia hic sunt ducimus expedita quo impedit soluta. Quam impedit et ipsum optio. Unde dolores nulla nobis vero et aspernatur officiis.
     * // Aliquam dolorem temporibus dolores voluptatem voluptatem qui nostrum quia. Sit hic facilis rerum eius. Beatae doloribus nesciunt iste ipsum.
     * // Natus nam eum nulla voluptas molestiae fuga libero nihil voluptatibus. Sed quam numquam eum ipsam temporibus eaque ut et. Enim quas debitis quasi quis. Vitae et vitae.
     * // Repellat voluptatem est laborum illo harum sed reprehenderit aut. Quo sit et. Exercitationem blanditiis totam velit ad dicta placeat.
     * // Rerum non eum incidunt amet quo. Eaque laborum ut. Recusandae illo ab distinctio veritatis. Cum quis architecto ad maxime a.'
     *
     * faker.lorem.paragraphs(2, '<br/>\n')
     * // 'Eos magnam aut qui accusamus. Sapiente quas culpa totam excepturi. Blanditiis totam distinctio occaecati dignissimos cumque atque qui officiis.<br/>
     * // Nihil quis vel consequatur. Blanditiis commodi deserunt sunt animi dolorum. A optio porro hic dolorum fugit aut et sint voluptas. Minima ad sed ipsa est non dolores.'
     *
     * faker.lorem.paragraphs({ min: 1, max: 3 })
     * // 'Eum nam fugiat laudantium.
     * // Dignissimos tempore porro necessitatibus commodi nam.
     * // Veniam at commodi iste perferendis totam dolorum corporis ipsam.'
     *
     * @since 2.0.1
     */
    paragraphs(paragraphCount?: number | {
      /**
       * The minimum number of paragraphs to generate.
       */
      min: number;
      /**
       * The maximum number of paragraphs to generate.
       */
      max: number;
    }, separator?: string): string;
    /**
     * Generates a random text based on a random lorem method.
     *
     * @example
     * faker.lorem.text() // 'Doloribus autem non quis vero quia.'
     * faker.lorem.text()
     * // 'Rerum eum reiciendis id ipsa hic dolore aut laborum provident.
     * // Quis beatae quis corporis veritatis corrupti ratione delectus sapiente ut.
     * // Quis ut dolor dolores facilis possimus tempore voluptates.
     * // Iure nam officia optio cumque.
     * // Dolor tempora iusto.'
     *
     * @since 3.1.0
     */
    text(): string;
    /**
     * Generates the given number lines of lorem separated by \`'\n'\`.
     *
     * @param lineCount The number of lines to generate. Defaults to a random number between \`1\` and \`5\`.
     * @param lineCount.min The minimum number of lines to generate. Defaults to \`1\`.
     * @param lineCount.max The maximum number of lines to generate. Defaults to \`5\`.
     *
     * @example
     * faker.lorem.lines()
     * // 'Rerum quia aliquam pariatur explicabo sint minima eos.
     * // Voluptatem repellat consequatur deleniti qui quibusdam harum cumque.
     * // Enim eveniet a qui.
     * // Consectetur velit eligendi animi nostrum veritatis.'
     *
     * faker.lorem.lines()
     * // 'Soluta deserunt eos quam reiciendis libero autem enim nam ut.
     * // Voluptate aut aut.'
     *
     * faker.lorem.lines(2)
     * // 'Quod quas nam quis impedit aut consequuntur.
     * // Animi dolores aspernatur.'
     *
     * faker.lorem.lines({ min: 1, max: 3 })
     * // 'Error dolorem natus quos eum consequatur necessitatibus.'
     *
     * @since 3.1.0
     */
    lines(lineCount?: number | {
      /**
       * The minimum number of lines to generate.
       */
      min: number;
      /**
       * The maximum number of lines to generate.
       */
      max: number;
    }): string;
  }
  declare class MusicModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random music genre.
     *
     * @example
     * faker.music.genre() // 'Reggae'
     *
     * @since 5.2.0
     */
    genre(): string;
    /**
     * Returns a random song name.
     *
     * @example
     * faker.music.songName() // 'White Christmas'
     *
     * @since 7.1.0
     */
    songName(): string;
  }
  declare class NumberModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a single random integer between zero and the given max value or the given range.
     * The bounds are inclusive.
     *
     * @param options Maximum value or options object. Defaults to \`{}\`.
     * @param options.min Lower bound for generated number. Defaults to \`0\`.
     * @param options.max Upper bound for generated number. Defaults to \`Number.MAX_SAFE_INTEGER\`.
     *
     * @throws When options define \`max < min\`.
     *
     * @see faker.string.numeric() If you would like to generate a \`string\` of digits with a given length (range).
     *
     * @example
     * faker.number.int() // 2900970162509863
     * faker.number.int(100) // 52
     * faker.number.int({ min: 1000000 }) // 2900970162509863
     * faker.number.int({ max: 100 }) // 42
     * faker.number.int({ min: 10, max: 100 }) // 57
     *
     * @since 8.0.0
     */
    int(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default Number.MAX_SAFE_INTEGER
       */
      max?: number;
    }): number;
    /**
     * Returns a single random floating-point number for a given precision or range and precision.
     *
     * @param options Upper bound or options object. Defaults to \`{}\`.
     * @param options.min Lower bound for generated number. Defaults to \`0.0\`.
     * @param options.max Upper bound for generated number. Defaults to \`1.0\`.
     * @param options.precision Precision of the generated number, for example \`0.01\` will round to 2 decimal points.
     *
     * @example
     * faker.number.float() // 0.5688541042618454
     * faker.number.float(3) // 2.367973240558058
     * faker.number.float({ min: -1000000 }) //-780678.849672846
     * faker.number.float({ max: 100 }) // 17.3687307164073
     * faker.number.float({ precision: 0.1 }) // 0.9
     * faker.number.float({ min: 10, max: 100, precision: 0.001 }) // 35.415
     *
     * @since 8.0.0
     */
    float(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0.0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default 1.0
       */
      max?: number;
      /**
       * Precision of the generated number.
       *
       * @default 0.01
       */
      precision?: number;
    }): number;
    /**
     * Returns a [binary](https://en.wikipedia.org/wiki/Binary_number) number.
     *
     * @param options Maximum value or options object. Defaults to \`{}\`.
     * @param options.min Lower bound for generated number. Defaults to \`0\`.
     * @param options.max Upper bound for generated number. Defaults to \`1\`.
     *
     * @throws When options define \`max < min\`.
     *
     * @see faker.string.binary() If you would like to generate a \`binary string\` with a given length (range).
     *
     * @example
     * faker.number.binary() // '1'
     * faker.number.binary(255) // '110101'
     * faker.number.binary({ min: 0, max: 65535 }) // '10110101'
     *
     * @since 8.0.0
     */
    binary(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default 1
       */
      max?: number;
    }): string;
    /**
     * Returns an [octal](https://en.wikipedia.org/wiki/Octal) number.
     *
     * @param options Maximum value or options object. Defaults to \`{}\`.
     * @param options.min Lower bound for generated number. Defaults to \`0\`.
     * @param options.max Upper bound for generated number. Defaults to \`7\`.
     *
     * @throws When options define \`max < min\`.
     *
     * @see faker.string.octal() If you would like to generate an \`octal string\` with a given length (range).
     *
     * @example
     * faker.number.octal() // '5'
     * faker.number.octal(255) // '377'
     * faker.number.octal({ min: 0, max: 65535 }) // '4766'
     *
     * @since 8.0.0
     */
    octal(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default 7
       */
      max?: number;
    }): string;
    /**
     * Returns a lowercase [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) number.
     *
     * @param options Maximum value or options object. Defaults to \`{}\`.
     * @param options.min Lower bound for generated number. Defaults to \`0\`.
     * @param options.max Upper bound for generated number. Defaults to \`15\`.
     *
     * @example
     * faker.number.hex() // 'b'
     * faker.number.hex(255) // '9d'
     * faker.number.hex({ min: 0, max: 65535 }) // 'af17'
     *
     * @since 8.0.0
     */
    hex(options?: number | {
      /**
       * Lower bound for generated number.
       *
       * @default 0
       */
      min?: number;
      /**
       * Upper bound for generated number.
       *
       * @default 15
       */
      max?: number;
    }): string;
    /**
     * Returns a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type) number.
     *
     * @param options Maximum value or options object. Defaults to \`{}\`.
     * @param options.min Lower bound for generated bigint. Defaults to \`0n\`.
     * @param options.max Upper bound for generated bigint. Defaults to \`min + 999999999999999n\`.
     *
     * @throws When options define \`max < min\`.
     *
     * @example
     * faker.number.bigInt() // 55422n
     * faker.number.bigInt(100n) // 52n
     * faker.number.bigInt({ min: 1000000n }) // 431433n
     * faker.number.bigInt({ max: 100n }) // 42n
     * faker.number.bigInt({ min: 10n, max: 100n }) // 36n
     *
     * @since 8.0.0
     */
    bigInt(options?: bigint | number | string | boolean | {
      /**
       * Lower bound for generated bigint.
       *
       * @default 0n
       */
      min?: bigint | number | string | boolean;
      /**
       * Upper bound for generated bigint.
       *
       * @default min + 999999999999999n
       */
      max?: bigint | number | string | boolean;
    }): bigint;
  }
  declare enum Sex {
    Female = "female",
    Male = "male"
  }
  type SexType = \`\${Sex}\`;
  declare class PersonModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random first name.
     *
     * @param sex The optional sex to use.
     * Can be either \`'female'\` or \`'male'\`.
     *
     * @example
     * faker.person.firstName() // 'Antwan'
     * faker.person.firstName('female') // 'Victoria'
     * faker.person.firstName('male') // 'Tom'
     *
     * @since 8.0.0
     */
    firstName(sex?: SexType): string;
    /**
     * Returns a random last name.
     *
     * @param sex The optional sex to use.
     * Can be either \`'female'\` or \`'male'\`.
     *
     * @example
     * faker.person.lastName() // 'Hauck'
     * faker.person.lastName('female') // 'Grady'
     * faker.person.lastName('male') // 'Barton'
     *
     * @since 8.0.0
     */
    lastName(sex?: SexType): string;
    /**
     * Returns a random middle name.
     *
     * @param sex The optional sex to use.
     * Can be either \`'female'\` or \`'male'\`.
     *
     * @example
     * faker.person.middleName() // 'James'
     * faker.person.middleName('female') // 'Eloise'
     * faker.person.middleName('male') // 'Asher'
     *
     * @since 8.0.0
     */
    middleName(sex?: SexType): string;
    /**
     * Generates a random full name.
     *
     * @param options An options object. Defaults to \`{}\`.
     * @param options.firstName The optional first name to use. If not specified a random one will be chosen.
     * @param options.lastName The optional last name to use. If not specified a random one will be chosen.
     * @param options.sex The optional sex to use. Can be either \`'female'\` or \`'male'\`.
     *
     * @example
     * faker.person.fullName() // 'Allen Brown'
     * faker.person.fullName({ firstName: 'Joann' }) // 'Joann Osinski'
     * faker.person.fullName({ firstName: 'Marcella', sex: 'female' }) // 'Mrs. Marcella Huels'
     * faker.person.fullName({ lastName: 'Beer' }) // 'Mr. Alfonso Beer'
     * faker.person.fullName({ sex: 'male' }) // 'Fernando Schaefer'
     *
     * @since 8.0.0
     */
    fullName(options?: {
      /**
       * The optional first name to use. If not specified a random one will be chosen.
       *
       * @default faker.person.firstName(sex)
       */
      firstName?: string;
      /**
       * The optional last name to use. If not specified a random one will be chosen.
       *
       * @default faker.person.lastName(sex)
       */
      lastName?: string;
      /**
       * The optional sex to use. Can be either \`'female'\` or \`'male'\`.
       *
       * @default faker.helpers.arrayElement(['female', 'male'])
       */
      sex?: SexType;
    }): string;
    /**
     * Returns a random gender.
     *
     * @see faker.person.sex() if you would like to generate binary-gender value
     *
     * @example
     * faker.person.gender() // 'Trans*Man'
     *
     * @since 8.0.0
     */
    gender(): string;
    /**
     * Returns a random sex.
     *
     * Output of this method is localised, so it should not be used to fill the parameter \`sex\`
     * available in some other modules for example \`faker.person.firstName()\`.
     *
     * @see faker.person.gender() if you would like to generate gender related values.
     *
     * @example
     * faker.person.sex() // 'female'
     *
     * @since 8.0.0
     */
    sex(): string;
    /**
     * Returns a random sex type.
     *
     * @example
     * faker.person.sexType() // Sex.Female
     *
     * @since 8.0.0
     */
    sexType(): SexType;
    /**
     * Returns a random short biography
     *
     * @example
     * faker.person.bio() // 'oatmeal advocate, veteran 🐠'
     *
     * @since 8.0.0
     */
    bio(): string;
    /**
     * Returns a random person prefix.
     *
     * @param sex The optional sex to use. Can be either \`'female'\` or \`'male'\`.
     *
     * @example
     * faker.person.prefix() // 'Miss'
     * faker.person.prefix('female') // 'Ms.'
     * faker.person.prefix('male') // 'Mr.'
     *
     * @since 8.0.0
     */
    prefix(sex?: SexType): string;
    /**
     * Returns a random person suffix.
     *
     * @example
     * faker.person.suffix() // 'DDS'
     *
     * @since 8.0.0
     */
    suffix(): string;
    /**
     * Generates a random job title.
     *
     * @example
     * faker.person.jobTitle() // 'Global Accounts Engineer'
     *
     * @since 8.0.0
     */
    jobTitle(): string;
    /**
     * Generates a random job descriptor.
     *
     * @example
     * faker.person.jobDescriptor() // 'Customer'
     *
     * @since 8.0.0
     */
    jobDescriptor(): string;
    /**
     * Generates a random job area.
     *
     * @example
     * faker.person.jobArea() // 'Brand'
     *
     * @since 8.0.0
     */
    jobArea(): string;
    /**
     * Generates a random job type.
     *
     * @example
     * faker.person.jobType() // 'Assistant'
     *
     * @since 8.0.0
     */
    jobType(): string;
    /**
     * Returns a random zodiac sign.
     *
     * @example
     * faker.person.zodiacSign() // 'Pisces'
     *
     * @since 8.0.0
     */
    zodiacSign(): string;
  }
  declare class PhoneModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a random phone number.
     *
     * @example
     * faker.phone.number() // '961-770-7727'
     *
     * @since 7.3.0
     */
    number(): string;
    /**
     * Generates a random phone number.
     *
     * @param format Format of the phone number.
     *
     * @example
     * faker.phone.number('501-###-###') // '501-039-841'
     * faker.phone.number('+48 91 ### ## ##') // '+48 91 463 61 70'
     *
     * @since 7.3.0
     *
     * @deprecated Use \`faker.phone.number()\` without an argument instead.
     */
    number(format: string): string;
    /**
     * Generates a random phone number.
     *
     * @param format Format of the phone number. Defaults to a random phone number format.
     *
     * @example
     * faker.phone.number() // '961-770-7727'
     *
     * @since 7.3.0
     */
    number(format?: string): string;
    /**
     * Generates IMEI number.
     *
     * @example
     * faker.phone.imei() // '13-850175-913761-7'
     *
     * @since 6.2.0
     */
    imei(): string;
  }
  type LiteralUnion<TSuggested extends TBase, TBase = string> = TSuggested | (TBase & {
    zz_IGNORE_ME?: never;
  });
  type LowerAlphaChar = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
  type UpperAlphaChar = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
  type NumericChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
  type AlphaChar = LowerAlphaChar | UpperAlphaChar;
  type AlphaNumericChar = AlphaChar | NumericChar;
  declare class StringModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a string from the given characters.
     *
     * @param characters The characters to use for the string. Can be a string or an array of characters.
     * If it is an array, then each element is treated as a single character even if it is a string with multiple characters.
     * @param length The length of the string to generate. Defaults to \`1\`.
     * @param length.min The minimum length of the string to generate.
     * @param length.max The maximum length of the string to generate.
     *
     * @example
     * faker.string.fromCharacters('abc') // 'c'
     * faker.string.fromCharacters(['a', 'b', 'c']) // 'a'
     * faker.string.fromCharacters('abc', 10) // 'cbbbacbacb'
     * faker.string.fromCharacters('abc', { min: 5, max: 10 }) // 'abcaaaba'
     *
     * @since 8.0.0
     */
    fromCharacters(characters: string | ReadonlyArray<string>, length?: number | {
      /**
       * The minimum length of the string to generate.
       */
      min: number;
      /**
       * The maximum length of the string to generate.
       */
      max: number;
    }): string;
    /**
     * Generating a string consisting of letters in the English alphabet.
     *
     * @param options Either the number of characters or an options instance.
     * @param options.length The number or range of characters to generate. Defaults to \`1\`.
     * @param options.casing The casing of the characters. Defaults to \`'mixed'\`.
     * @param options.exclude An array with characters which should be excluded in the generated string. Defaults to \`[]\`.
     *
     * @example
     * faker.string.alpha() // 'b'
     * faker.string.alpha(10) // 'fEcAaCVbaR'
     * faker.string.alpha({ length: { min: 5, max: 10 } }) // 'HcVrCf'
     * faker.string.alpha({ casing: 'lower' }) // 'r'
     * faker.string.alpha({ exclude: ['W'] }) // 'Z'
     * faker.string.alpha({ length: 5, casing: 'upper', exclude: ['A'] }) // 'DTCIC'
     *
     * @since 8.0.0
     */
    alpha(options?: number | {
      /**
       * The number or range of characters to generate.
       *
       * @default 1
       */
      length?: number | {
        /**
         * The minimum number of characters to generate.
         */
        min: number;
        /**
         * The maximum number of characters to generate.
         */
        max: number;
      };
      /**
       * The casing of the characters.
       *
       * @default 'mixed'
       */
      casing?: Casing;
      /**
       * An array with characters which should be excluded in the generated string.
       *
       * @default []
       */
      exclude?: ReadonlyArray<LiteralUnion<AlphaChar>> | string;
    }): string;
    /**
     * Generating a string consisting of alpha characters and digits.
     *
     * @param options Either the number of characters or an options instance.
     * @param options.length The number or range of characters and digits to generate. Defaults to \`1\`.
     * @param options.casing The casing of the characters. Defaults to \`'mixed'\`.
     * @param options.exclude An array of characters and digits which should be excluded in the generated string. Defaults to \`[]\`.
     *
     * @example
     * faker.string.alphanumeric() // '2'
     * faker.string.alphanumeric(5) // '3e5V7'
     * faker.string.alphanumeric({ length: { min: 5, max: 10 } }) // 'muaApG'
     * faker.string.alphanumeric({ casing: 'upper' }) // 'A'
     * faker.string.alphanumeric({ exclude: ['W'] }) // 'r'
     * faker.string.alphanumeric({ length: 5, exclude: ["a"] }) // 'x1Z7f'
     *
     * @since 8.0.0
     */
    alphanumeric(options?: number | {
      /**
       * The number or range of characters and digits to generate.
       *
       * @default 1
       */
      length?: number | {
        /**
         * The minimum number of characters and digits to generate.
         */
        min: number;
        /**
         * The maximum number of characters and digits to generate.
         */
        max: number;
      };
      /**
       * The casing of the characters.
       *
       * @default 'mixed'
       */
      casing?: Casing;
      /**
       * An array of characters and digits which should be excluded in the generated string.
       *
       * @default []
       */
      exclude?: ReadonlyArray<LiteralUnion<AlphaNumericChar>> | string;
    }): string;
    /**
     * Returns a [binary](https://en.wikipedia.org/wiki/Binary_number) string.
     *
     * @param options The optional options object.
     * @param options.length The number or range of characters to generate after the prefix. Defaults to \`1\`.
     * @param options.prefix Prefix for the generated number. Defaults to \`'0b'\`.
     *
     * @see faker.number.binary() If you would like to generate a \`binary number\` (within a range).
     *
     * @example
     * faker.string.binary() // '0b1'
     * faker.string.binary({ length: 10 }) // '0b1101011011'
     * faker.string.binary({ length: { min: 5, max: 10 } }) // '0b11101011'
     * faker.string.binary({ prefix: '0b' }) // '0b1'
     * faker.string.binary({ length: 10, prefix: 'bin_' }) // 'bin_1101011011'
     *
     * @since 8.0.0
     */
    binary(options?: {
      length?: number | {
        /**
         * The minimum number of characters to generate.
         */
        min: number;
        /**
         * The maximum number of characters to generate.
         */
        max: number;
      };
      prefix?: string;
    }): string;
    /**
     * Returns an [octal](https://en.wikipedia.org/wiki/Octal) string.
     *
     * @param options The optional options object.
     * @param options.length The number or range of characters to generate after the prefix. Defaults to \`1\`.
     * @param options.prefix Prefix for the generated number. Defaults to \`'0o'\`.
     *
     * @see faker.number.octal() If you would like to generate an \`octal number\` (within a range).
     *
     * @example
     * faker.string.octal() // '0o3'
     * faker.string.octal({ length: 10 }) // '0o1526216210'
     * faker.string.octal({ length: { min: 5, max: 10 } }) // '0o15263214'
     * faker.string.octal({ prefix: '0o' }) // '0o7'
     * faker.string.octal({ length: 10, prefix: 'oct_' }) // 'oct_1542153414'
     *
     * @since 8.0.0
     */
    octal(options?: {
      length?: number | {
        /**
         * The minimum number of characters to generate.
         */
        min: number;
        /**
         * The maximum number of characters to generate.
         */
        max: number;
      };
      prefix?: string;
    }): string;
    /**
     * Returns a [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) string.
     *
     * @param options The optional options object.
     * @param options.length The number or range of characters to generate after the prefix. Defaults to \`1\`.
     * @param options.casing Casing of the generated number. Defaults to \`'mixed'\`.
     * @param options.prefix Prefix for the generated number. Defaults to \`'0x'\`.
     *
     * @example
     * faker.string.hexadecimal() // '0xB'
     * faker.string.hexadecimal({ length: 10 }) // '0xaE13d044cB'
     * faker.string.hexadecimal({ length: { min: 5, max: 10 } }) // '0x7dEf7FCD'
     * faker.string.hexadecimal({ prefix: '0x' }) // '0xE'
     * faker.string.hexadecimal({ casing: 'lower' }) // '0xf'
     * faker.string.hexadecimal({ length: 10, prefix: '#' }) // '#f12a974eB1'
     * faker.string.hexadecimal({ length: 10, casing: 'upper' }) // '0xE3F38014FB'
     * faker.string.hexadecimal({ casing: 'lower', prefix: '' }) // 'd'
     * faker.string.hexadecimal({ length: 10, casing: 'mixed', prefix: '0x' }) // '0xAdE330a4D1'
     *
     * @since 8.0.0
     */
    hexadecimal(options?: {
      /**
       * The number or range of characters to generate after the prefix.
       *
       * @default 1
       */
      length?: number | {
        /**
         * The minimum number of characters to generate after the prefix.
         */
        min: number;
        /**
         * The maximum number of characters to generate after the prefix.
         */
        max: number;
      };
      /**
       * Casing of the generated number.
       *
       * @default 'mixed'
       */
      casing?: Casing;
      /**
       * Prefix for the generated number.
       *
       * @default '0x'
       */
      prefix?: string;
    }): string;
    /**
     * Generates a given length string of digits.
     *
     * @param options Either the number of characters or the options to use.
     * @param options.length The number or range of digits to generate. Defaults to \`1\`.
     * @param options.allowLeadingZeros Whether leading zeros are allowed or not. Defaults to \`true\`.
     * @param options.exclude An array of digits which should be excluded in the generated string. Defaults to \`[]\`.
     *
     * @see faker.number.int() If you would like to generate a \`number\` (within a range).
     *
     * @example
     * faker.string.numeric() // '2'
     * faker.string.numeric(5) // '31507'
     * faker.string.numeric(42) // '06434563150765416546479875435481513188548'
     * faker.string.numeric({ length: { min: 5, max: 10 } }) // '197089478'
     * faker.string.numeric({ length: 42, allowLeadingZeros: false }) // '72564846278453876543517840713421451546115'
     * faker.string.numeric({ length: 6, exclude: ['0'] }) // '943228'
     *
     * @since 8.0.0
     */
    numeric(options?: number | {
      /**
       * The number or range of digits to generate.
       *
       * @default 1
       */
      length?: number | {
        /**
         * The minimum number of digits to generate.
         */
        min: number;
        /**
         * The maximum number of digits to generate.
         */
        max: number;
      };
      /**
       * Whether leading zeros are allowed or not.
       *
       * @default true
       */
      allowLeadingZeros?: boolean;
      /**
       * An array of digits which should be excluded in the generated string.
       *
       * @default []
       */
      exclude?: ReadonlyArray<LiteralUnion<NumericChar>> | string;
    }): string;
    /**
     * Returns a string containing UTF-16 chars between 33 and 125 (\`!\` to \`}\`).
     *
     * @param length Length of the generated string. Max length is \`2^20\`. Defaults to \`10\`.
     * @param length.min The minimum number of characters to generate.
     * @param length.max The maximum number of characters to generate.
     *
     * @example
     * faker.string.sample() // 'Zo!.:*e>wR'
     * faker.string.sample(5) // '6Bye8'
     * faker.string.sample({ min: 5, max: 10 }) // 'FeKunG'
     *
     * @since 8.0.0
     */
    sample(length?: number | {
      /**
       * The minimum number of characters to generate.
       */
      min: number;
      /**
       * The maximum number of characters to generate.
       */
      max: number;
    }): string;
    /**
     * Returns a UUID v4 ([Universally Unique Identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier)).
     *
     * @example
     * faker.string.uuid() // '4136cd0b-d90b-4af7-b485-5d1ded8db252'
     *
     * @since 8.0.0
     */
    uuid(): string;
    /**
     * Generates a [Nano ID](https://github.com/ai/nanoid).
     *
     * @param length Length of the generated string. Defaults to \`21\`.
     * @param length.min The minimum length of the Nano ID to generate.
     * @param length.max The maximum length of the Nano ID to generate.
     *
     * @example
     * faker.string.nanoid() // ptL0KpX_yRMI98JFr6B3n
     * faker.string.nanoid(10) // VsvwSdm_Am
     * faker.string.nanoid({ min: 13, max: 37 }) // KIRsdEL9jxVgqhBDlm
     *
     * @since 8.0.0
     */
    nanoid(length?: number | {
      /**
       * The minimum length of the Nano ID to generate.
       */
      min: number;
      /**
       * The maximum length of the Nano ID to generate.
       */
      max: number;
    }): string;
    /**
     * Returns a string containing only special characters from the following list:
     * \`\`\`txt
     * ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ \` { | } ~
     * \`\`\`
     *
     * @param length Length of the generated string. Defaults to \`1\`.
     * @param length.min The minimum number of special characters to generate.
     * @param length.max The maximum number of special characters to generate.
     *
     * @example
     * faker.string.symbol() // '$'
     * faker.string.symbol(5) // '#*!.~'
     * faker.string.symbol({ min: 5, max: 10 }) // ')|@*>^+'
     *
     * @since 8.0.0
     */
    symbol(length?: number | {
      /**
       * The minimum number of special characters to generate.
       */
      min: number;
      /**
       * The maximum number of special characters to generate.
       */
      max: number;
    }): string;
  }
  declare class RandomModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random word.
     *
     * @see faker.lorem.word()
     * @see faker.word.sample()
     *
     * @example
     * faker.random.word() // 'Seamless'
     *
     * @since 3.1.0
     *
     * @deprecated Use \`faker.lorem.word()\` or \`faker.word.sample()\` instead.
     */
    word(): string;
    /**
     * Returns a string with a given number of random words.
     *
     * @param count The number or range of words. Defaults to a random value between \`1\` and \`3\`.
     * @param count.min The minimum number of words. Defaults to \`1\`.
     * @param count.max The maximum number of words. Defaults to \`3\`.
     *
     * @see faker.lorem.words()
     * @see faker.word.words()
     *
     * @example
     * faker.random.words() // 'neural'
     * faker.random.words(5) // 'copy Handcrafted bus client-server Point'
     * faker.random.words({ min: 3, max: 5 }) // 'cool sticky Borders'
     *
     * @since 3.1.0
     *
     * @deprecated Use \`faker.lorem.words()\` or \`faker.word.words()\` instead.
     */
    words(count?: number | {
      /**
       * The minimum number of words.
       */
      min: number;
      /**
       * The maximum number of words.
       */
      max: number;
    }): string;
    /**
     * Do NOT use. This property has been removed.
     *
     * @example
     * faker.helpers.objectKey(allLocales)
     * faker.helpers.objectValue(allFakers)
     *
     * @since 3.1.0
     *
     * @deprecated Use \`faker.helpers.objectKey(allLocales/allFakers)\` instead.
     */
    private locale;
    /**
     * Generating a string consisting of letters in the English alphabet.
     *
     * @param options Either the number of characters or an options instance. Defaults to \`{ count: 1, casing: 'mixed', bannedChars: [] }\`.
     * @param options.count The number of characters to generate. Defaults to \`1\`.
     * @param options.casing The casing of the characters. Defaults to \`'mixed'\`.
     * @param options.bannedChars An array with characters to exclude. Defaults to \`[]\`.
     *
     * @see faker.string.alpha()
     *
     * @example
     * faker.random.alpha() // 'b'
     * faker.random.alpha(10) // 'qccrabobaf'
     * faker.random.alpha({ count: 5, casing: 'upper', bannedChars: ['A'] }) // 'DTCIC'
     *
     * @since 5.0.0
     *
     * @deprecated Use \`faker.string.alpha()\` instead.
     */
    alpha(options?: number | {
      /**
       * The number of characters to generate.
       *
       * @default 1
       */
      count?: number;
      /**
       * The casing of the characters.
       *
       * @default 'mixed'
       */
      casing?: Casing;
      /**
       * An array with characters to exclude.
       *
       * @default []
       */
      bannedChars?: ReadonlyArray<LiteralUnion<AlphaChar>> | string;
    }): string;
    /**
     * Generating a string consisting of alpha characters and digits.
     *
     * @param count The number of characters and digits to generate. Defaults to \`1\`.
     * @param options The options to use. Defaults to \`{ bannedChars: [] }\`.
     * @param options.casing The casing of the characters. Defaults to \`'lower'\`.
     * @param options.bannedChars An array of characters and digits which should be banned in the generated string. Defaults to \`[]\`.
     *
     * @see faker.string.alphanumeric()
     *
     * @example
     * faker.random.alphaNumeric() // '2'
     * faker.random.alphaNumeric(5) // '3e5v7'
     * faker.random.alphaNumeric(5, { bannedChars: ["a"] }) // 'xszlm'
     *
     * @since 3.1.0
     *
     * @deprecated Use \`faker.string.alphanumeric()\` instead.
     */
    alphaNumeric(count?: number, options?: {
      /**
       * The casing of the characters.
       *
       * @default 'lower'
       */
      casing?: Casing;
      /**
       * An array of characters and digits which should be banned in the generated string.
       *
       * @default []
       */
      bannedChars?: ReadonlyArray<LiteralUnion<AlphaNumericChar>> | string;
    }): string;
    /**
     * Generates a given length string of digits.
     *
     * @param length The number of digits to generate. Defaults to \`1\`.
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.allowLeadingZeros Whether leading zeros are allowed or not. Defaults to \`true\`.
     * @param options.bannedDigits An array of digits which should be banned in the generated string. Defaults to \`[]\`.
     *
     * @see faker.string.numeric()
     *
     * @example
     * faker.random.numeric() // '2'
     * faker.random.numeric(5) // '31507'
     * faker.random.numeric(42) // '00434563150765416546479875435481513188548'
     * faker.random.numeric(42, { allowLeadingZeros: true }) // '00564846278453876543517840713421451546115'
     * faker.random.numeric(6, { bannedDigits: ['0'] }) // '943228'
     *
     * @since 6.3.0
     *
     * @deprecated Use \`faker.string.numeric()\` instead.
     */
    numeric(length?: number, options?: {
      /**
       * Whether leading zeros are allowed or not.
       *
       * @default true
       */
      allowLeadingZeros?: boolean;
      /**
       * An array of digits which should be banned in the generated string.
       *
       * @default []
       */
      bannedDigits?: ReadonlyArray<LiteralUnion<NumericChar>> | string;
    }): string;
  }
  interface ChemicalElement {
    /**
     * The symbol for the element (e.g. \`'He'\`).
     */
    symbol: string;
    /**
     * The name for the element (e.g. \`'Cerium'\`).
     */
    name: string;
    /**
     * The atomic number for the element (e.g. \`52\`).
     */
    atomicNumber: number;
  }
  interface Unit {
    /**
     * The long version of the unit (e.g. \`meter\`).
     */
    name: string;
    /**
     * The short version/abbreviation of the element (e.g. \`Pa\`).
     */
    symbol: string;
  }
  declare class ScienceModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random periodic table element.
     *
     * @example
     * faker.science.chemicalElement() // { symbol: 'H', name: 'Hydrogen', atomicNumber: 1 }
     * faker.science.chemicalElement() // { symbol: 'Xe', name: 'Xenon', atomicNumber: 54 }
     * faker.science.chemicalElement() // { symbol: 'Ce', name: 'Cerium', atomicNumber: 58 }
     *
     * @since 7.2.0
     */
    chemicalElement(): ChemicalElement;
    /**
     * Returns a random scientific unit.
     *
     * @example
     * faker.science.unit() // { name: 'meter', symbol: 'm' }
     * faker.science.unit() // { name: 'second', symbol: 's' }
     * faker.science.unit() // { name: 'mole', symbol: 'mol' }
     *
     * @since 7.2.0
     */
    unit(): Unit;
  }
  declare const commonInterfaceTypes: readonly [
    "en",
    "wl",
    "ww"
  ];
  declare const commonInterfaceSchemas: {
    readonly index: "o";
    readonly slot: "s";
    readonly mac: "x";
    readonly pci: "p";
  };
  declare class SystemModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random file name with extension.
     *
     * @param options An options object.
     * @param options.extensionCount Define how many extensions the file name should have. Defaults to \`1\`.
     *
     * @example
     * faker.system.fileName() // 'faithfully_calculating.u8mdn'
     * faker.system.fileName({ extensionCount: 2 }) // 'times_after.swf.ntf'
     * faker.system.fileName({ extensionCount: { min: 1, max: 2 } }) // 'jaywalk_like_ill.osfpvg'
     *
     * @since 3.1.0
     */
    fileName(options?: {
      /**
       * Define how many extensions the file name should have.
       *
       * @default 1
       */
      extensionCount?: number | {
        /**
         * Minimum number of extensions.
         */
        min: number;
        /**
         * Maximum number of extensions.
         */
        max: number;
      };
    }): string;
    /**
     * Returns a random file name with a given extension or a commonly used extension.
     *
     * @param ext Extension. Empty string is considered to be not set.
     *
     * @example
     * faker.system.commonFileName() // 'dollar.jpg'
     * faker.system.commonFileName('txt') // 'global_borders_wyoming.txt'
     *
     * @since 3.1.0
     */
    commonFileName(ext?: string): string;
    /**
     * Returns a mime-type.
     *
     * @example
     * faker.system.mimeType() // 'video/vnd.vivo'
     *
     * @since 3.1.0
     */
    mimeType(): string;
    /**
     * Returns a commonly used file type.
     *
     * @example
     * faker.system.commonFileType() // 'audio'
     *
     * @since 3.1.0
     */
    commonFileType(): string;
    /**
     * Returns a commonly used file extension.
     *
     * @example
     * faker.system.commonFileExt() // 'gif'
     *
     * @since 3.1.0
     */
    commonFileExt(): string;
    /**
     * Returns a file type.
     *
     * @example
     * faker.system.fileType() // 'message'
     *
     * @since 3.1.0
     */
    fileType(): string;
    /**
     * Returns a file extension.
     *
     * @param mimeType Valid [mime-type](https://github.com/jshttp/mime-db/blob/master/db.json)
     *
     * @example
     * faker.system.fileExt() // 'emf'
     * faker.system.fileExt('application/json') // 'json'
     *
     * @since 3.1.0
     */
    fileExt(mimeType?: string): string;
    /**
     * Returns a directory path.
     *
     * @example
     * faker.system.directoryPath() // '/etc/mail'
     *
     * @since 3.1.0
     */
    directoryPath(): string;
    /**
     * Returns a file path.
     *
     * @example
     * faker.system.filePath() // '/usr/local/src/money.dotx'
     *
     * @since 3.1.0
     */
    filePath(): string;
    /**
     * Returns a [semantic version](https://semver.org).
     *
     * @example
     * faker.system.semver() // '1.1.2'
     *
     * @since 3.1.0
     */
    semver(): string;
    /**
     * Returns a random [network interface](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/networking_guide/sec-understanding_the_predictable_network_interface_device_names).
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.interfaceType The interface type. Can be one of \`en\`, \`wl\`, \`ww\`.
     * @param options.interfaceSchema The interface schema. Can be one of \`index\`, \`slot\`, \`mac\`, \`pci\`.
     *
     * @example
     * faker.system.networkInterface() // 'enp0s3'
     * faker.system.networkInterface({ interfaceType: 'wl' }) // 'wlo1'
     * faker.system.networkInterface({ interfaceSchema: 'mac' }) // 'enx000c29c00000'
     * faker.system.networkInterface({ interfaceType: 'en', interfaceSchema: 'pci' }) // 'enp5s0f1d0'
     *
     * @since 7.4.0
     */
    networkInterface(options?: {
      /**
       * The interface type. Can be one of \`en\`, \`wl\`, \`ww\`.
       *
       * @default faker.helpers.arrayElement(['en', 'wl', 'ww'])
       */
      interfaceType?: (typeof commonInterfaceTypes)[number];
      /**
       * The interface schema. Can be one of \`index\`, \`slot\`, \`mac\`, \`pci\`.
       *
       * @default faker.helpers.objectKey(['index' | 'slot' | 'mac' | 'pci'])
       */
      interfaceSchema?: keyof typeof commonInterfaceSchemas;
    }): string;
    /**
     * Returns a random cron expression.
     *
     * @param options The optional options to use.
     * @param options.includeYear Whether to include a year in the generated expression. Defaults to \`false\`.
     * @param options.includeNonStandard Whether to include a @yearly, @monthly, @daily, etc text labels in the generated expression. Defaults to \`false\`.
     *
     * @example
     * faker.system.cron() // '45 23 * * 6'
     * faker.system.cron({ includeYear: true }) // '45 23 * * 6 2067'
     * faker.system.cron({ includeYear: false }) // '45 23 * * 6'
     * faker.system.cron({ includeNonStandard: false }) // '45 23 * * 6'
     * faker.system.cron({ includeNonStandard: true }) // '@yearly'
     *
     * @since 7.5.0
     */
    cron(options?: {
      /**
       * Whether to include a year in the generated expression.
       *
       * @default false
       */
      includeYear?: boolean;
      /**
       * Whether to include a @yearly, @monthly, @daily, etc text labels in the generated expression.
       *
       * @default false
       */
      includeNonStandard?: boolean;
    }): string;
  }
  declare class VehicleModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns a random vehicle.
     *
     * @example
     * faker.vehicle.vehicle() // 'BMW Explorer'
     *
     * @since 5.0.0
     */
    vehicle(): string;
    /**
     * Returns a manufacturer name.
     *
     * @example
     * faker.vehicle.manufacturer() // 'Ford'
     *
     * @since 5.0.0
     */
    manufacturer(): string;
    /**
     * Returns a vehicle model.
     *
     * @example
     * faker.vehicle.model() // 'Explorer'
     *
     * @since 5.0.0
     */
    model(): string;
    /**
     * Returns a vehicle type.
     *
     * @example
     * faker.vehicle.type() // 'Coupe'
     *
     * @since 5.0.0
     */
    type(): string;
    /**
     * Returns a fuel type.
     *
     * @example
     * faker.vehicle.fuel() // 'Electric'
     *
     * @since 5.0.0
     */
    fuel(): string;
    /**
     * Returns a vehicle identification number (VIN).
     *
     * @example
     * faker.vehicle.vin() // 'YV1MH682762184654'
     *
     * @since 5.0.0
     */
    vin(): string;
    /**
     * Returns a vehicle color.
     *
     * @example
     * faker.vehicle.color() // 'red'
     *
     * @since 5.0.0
     */
    color(): string;
    /**
     * Returns a vehicle registration number (Vehicle Registration Mark - VRM)
     *
     * @example
     * faker.vehicle.vrm() // 'MF56UPA'
     *
     * @since 5.4.0
     */
    vrm(): string;
    /**
     * Returns a type of bicycle.
     *
     * @example
     * faker.vehicle.bicycle() // 'Adventure Road Bicycle'
     *
     * @since 5.5.0
     */
    bicycle(): string;
  }
  declare class WordModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Returns an adjective of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.adjective() // 'pungent'
     * faker.word.adjective(5) // 'slimy'
     * faker.word.adjective(100) // 'complete'
     * faker.word.adjective({ strategy: 'shortest' }) // 'icy'
     * faker.word.adjective({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'distant'
     *
     * @since 6.0.0
     */
    adjective(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns an adverb of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.adverb() // 'quarrelsomely'
     * faker.word.adverb(5) // 'madly'
     * faker.word.adverb(100) // 'sadly'
     * faker.word.adverb({ strategy: 'shortest' }) // 'too'
     * faker.word.adverb({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'sweetly'
     *
     * @since 6.0.0
     */
    adverb(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns a conjunction of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.conjunction() // 'in order that'
     * faker.word.conjunction(5) // 'since'
     * faker.word.conjunction(100) // 'as long as'
     * faker.word.conjunction({ strategy: 'shortest' }) // 'or'
     * faker.word.conjunction({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'hence'
     *
     * @since 6.0.0
     */
    conjunction(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns an interjection of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.interjection() // 'gah'
     * faker.word.interjection(5) // 'fooey'
     * faker.word.interjection(100) // 'yowza'
     * faker.word.interjection({ strategy: 'shortest' }) // 'hm'
     * faker.word.interjection({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'boohoo'
     *
     * @since 6.0.0
     */
    interjection(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns a noun of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.noun() // 'external'
     * faker.word.noun(5) // 'front'
     * faker.word.noun(100) // 'care'
     * faker.word.noun({ strategy: 'shortest' }) // 'ad'
     * faker.word.noun({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'average'
     *
     * @since 6.0.0
     */
    noun(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns a preposition of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.preposition() // 'without'
     * faker.word.preposition(5) // 'abaft'
     * faker.word.preposition(100) // 'an'
     * faker.word.preposition({ strategy: 'shortest' }) // 'a'
     * faker.word.preposition({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'given'
     *
     * @since 6.0.0
     */
    preposition(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns a verb of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.verb() // 'act'
     * faker.word.verb(5) // 'tinge'
     * faker.word.verb(100) // 'mess'
     * faker.word.verb({ strategy: 'shortest' }) // 'do'
     * faker.word.verb({ length: { min: 5, max: 7 }, strategy: "fail" }) // 'vault'
     *
     * @since 6.0.0
     */
    verb(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns a random sample of random or optionally specified length.
     *
     * @param options The expected length of the word or the options to use.
     * @param options.length The expected length of the word.
     * @param options.strategy The strategy to apply when no words with a matching length are found.
     *
     * Available error handling strategies:
     *
     * - \`fail\`: Throws an error if no words with the given length are found.
     * - \`shortest\`: Returns any of the shortest words.
     * - \`closest\`: Returns any of the words closest to the given length.
     * - \`longest\`: Returns any of the longest words.
     * - \`any-length\`: Returns a word with any length.
     *
     * Defaults to \`'any-length'\`.
     *
     * @example
     * faker.word.sample() // 'incidentally'
     * faker.word.sample(5) // 'fruit'
     *
     * @since 8.0.0
     */
    sample(options?: number | {
      /**
       * The expected length of the word.
       */
      length?: number | {
        /**
         * The minimum length of the word.
         */
        min: number;
        /**
         * The maximum length of the word.
         */
        max: number;
      };
      /**
       * The strategy to apply when no words with a matching length are found.
       *
       * Available error handling strategies:
       *
       * - \`fail\`: Throws an error if no words with the given length are found.
       * - \`shortest\`: Returns any of the shortest words.
       * - \`closest\`: Returns any of the words closest to the given length.
       * - \`longest\`: Returns any of the longest words.
       * - \`any-length\`: Returns a word with any length.
       *
       * @default 'any-length'
       */
      strategy?: "fail" | "closest" | "shortest" | "longest" | "any-length";
    }): string;
    /**
     * Returns a string containing a number of space separated random words.
     *
     * @param options The optional options object or the number of words to return.
     * @param options.count The number of words to return. Defaults to a random value between \`1\` and \`3\`.
     *
     * @example
     * faker.word.words() // 'almost'
     * faker.word.words(5) // 'before hourly patiently dribble equal'
     * faker.word.words({ count: 5 }) // 'whoever edible um kissingly faraway'
     * faker.word.words({ count: { min: 5, max: 10 } }) // 'vice buoyant through apropos poised total wary boohoo'
     *
     * @since 8.0.0
     */
    words(options?: number | {
      /**
       * The number of words to return.
       *
       * @default { min: 1, max: 3 }
       */
      count?: number | {
        /**
         * The minimum number of words to return.
         */
        min: number;
        /**
         * The maximum number of words to return.
         */
        max: number;
      };
    }): string;
  }
  declare enum Aircraft {
    Narrowbody = "narrowbody",
    Regional = "regional",
    Widebody = "widebody"
  }
  type AircraftType = \`\${Aircraft}\`;
  interface Airline {
    /**
     * The name of the airline (e.g. \`'American Airlines'\`).
     */
    readonly name: string;
    /**
     * The 2 character IATA code of the airline (e.g. \`'AA'\`).
     */
    readonly iataCode: string;
  }
  interface Airplane {
    /**
     * The name of the airplane (e.g. \`'Airbus A321'\`).
     */
    readonly name: string;
    /**
     * The IATA code of the airplane (e.g. \`'321'\`).
     */
    readonly iataTypeCode: string;
  }
  interface Airport {
    /**
     * The name of the airport (e.g. \`'Dallas Fort Worth International Airport'\`).
     */
    readonly name: string;
    /**
     * The IATA code of the airport (e.g. \`'DFW'\`).
     */
    readonly iataCode: string;
  }
  declare class AirlineModule {
    private readonly faker;
    constructor(faker: Faker);
    /**
     * Generates a random airport.
     *
     * @example
     * faker.airline.airport() // { name: 'Dallas Fort Worth International Airport', iataCode: 'DFW' }
     *
     * @since 8.0.0
     */
    airport(): Airport;
    /**
     * Generates a random airline.
     *
     * @example
     * faker.airline.airline() // { name: 'American Airlines', iataCode: 'AA' }
     *
     * @since 8.0.0
     */
    airline(): Airline;
    /**
     * Generates a random airplane.
     *
     * @example
     * faker.airline.airplane() // { name: 'Airbus A321neo', iataTypeCode: '32Q' }
     *
     * @since 8.0.0
     */
    airplane(): Airplane;
    /**
     * Generates a random [record locator](https://en.wikipedia.org/wiki/Record_locator). Record locators
     * are used by airlines to identify reservations. They're also known as booking reference numbers,
     * locator codes, confirmation codes, or reservation codes.
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.allowNumerics Whether to allow numeric characters. Defaults to \`false\`.
     * @param options.allowVisuallySimilarCharacters Whether to allow visually similar characters such as '1' and 'I'. Defaults to \`false\`.
     *
     * @example
     * faker.airline.recordLocator() // 'KIFRWE'
     * faker.airline.recordLocator({ allowNumerics: true }) // 'E5TYEM'
     * faker.airline.recordLocator({ allowVisuallySimilarCharacters: true }) // 'ANZNEI'
     * faker.airline.recordLocator({ allowNumerics: true, allowVisuallySimilarCharacters: true }) // '1Z2Z3E'
     *
     * @since 8.0.0
     */
    recordLocator(options?: {
      /**
       * Whether to allow numeric characters.
       *
       * @default false
       */
      allowNumerics?: boolean;
      /**
       * Whether to allow visually similar characters such as '1' and 'I'.
       *
       * @default false
       */
      allowVisuallySimilarCharacters?: boolean;
    }): string;
    /**
     * Generates a random seat.
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.aircraftType The aircraft type. Can be one of \`narrowbody\`, \`regional\`, \`widebody\`. Defaults to \`narrowbody\`.
     *
     * @example
     * faker.airline.seat() // '22C'
     * faker.airline.seat({ aircraftType: 'regional' }) // '7A'
     * faker.airline.seat({ aircraftType: 'widebody' }) // '42K'
     *
     * @since 8.0.0
     */
    seat(options?: {
      /**
       * The aircraft type. Can be one of \`narrowbody\`, \`regional\`, \`widebody\`.
       *
       * @default 'narrowbody'
       */
      aircraftType?: AircraftType;
    }): string;
    /**
     * Returns a random aircraft type.
     *
     * @example
     * faker.airline.aircraftType() // 'narrowbody'
     *
     * @since 8.0.0
     */
    aircraftType(): AircraftType;
    /**
     * Returns a random flight number. Flight numbers are always 1 to 4 digits long. Sometimes they are
     * used without leading zeros (e.g.: \`American Airlines flight 425\`) and sometimes with leading
     * zeros, often with the airline code prepended (e.g.: \`AA0425\`).
     *
     * To generate a flight number prepended with an airline code, combine this function with the
     * \`airline()\` function and use template literals:
     * \`\`\`
     * \`\${faker.airline.airline().iataCode}\${faker.airline.flightNumber({ addLeadingZeros: true })}\` // 'AA0798'
     * \`\`\`
     *
     * @param options The options to use. Defaults to \`{}\`.
     * @param options.length The number or range of digits to generate. Defaults to \`{ min: 1, max: 4 }\`.
     * @param options.addLeadingZeros Whether to pad the flight number up to 4 digits with leading zeros. Defaults to \`false\`.
     *
     * @example
     * faker.airline.flightNumber() // '2405'
     * faker.airline.flightNumber({ addLeadingZeros: true }) // '0249'
     * faker.airline.flightNumber({ addLeadingZeros: true, length: 2 }) // '0042'
     * faker.airline.flightNumber({ addLeadingZeros: true, length: { min: 2, max: 3 } }) // '0624'
     * faker.airline.flightNumber({ length: 3 }) // '425'
     * faker.airline.flightNumber({ length: { min: 2, max: 3 } }) // '84'
     *
     * @since 8.0.0
     */
    flightNumber(options?: {
      /**
       * The number or range of digits to generate.
       *
       * @default { min: 1, max: 4 }
       */
      length?: number | {
        /**
         * The minimum number of digits to generate.
         */
        min: number;
        /**
         * The maximum number of digits to generate.
         */
        max: number;
      };
      /**
       * Whether to pad the flight number up to 4 digits with leading zeros.
       *
       * @default false
       */
      addLeadingZeros?: boolean;
    }): string;
  }
  type AnimalDefinition = LocaleEntry<{
    bear: string[];
    bird: string[];
    cat: string[];
    cetacean: string[];
    cow: string[];
    crocodilia: string[];
    dog: string[];
    fish: string[];
    horse: string[];
    insect: string[];
    lion: string[];
    rabbit: string[];
    rodent: string[];
    snake: string[];
    type: string[];
  }>;
  type ColorDefinition = LocaleEntry<{
    /**
     * Human-readable color names.
     */
    human: string[];
    /**
     * Color space names.
     */
    space: string[];
  }>;
  type CommerceDefinition = LocaleEntry<{
    /**
     * Department names inside a shop.
     */
    department: string[];
    /**
     * Product name generation definitions.
     */
    product_name: CommerceProductNameDefinition;
    /**
     * Descriptions for products.
     */
    product_description: string[];
  }>;
  interface CommerceProductNameDefinition {
    /**
     * Adjectives describing a product (e.g. tasty).
     */
    adjective: string[];
    /**
     * Materials describing a product (e.g. wood).
     */
    material: string[];
    /**
     * Types of products (e.g. chair).
     */
    product: string[];
  }
  type CompanyDefinition = LocaleEntry<{
    /**
     * Business/products related adjectives that can be used to demonstrate data being viewed by a manager.
     */
    buzz_adjective: string[];
    /**
     * Business/products related nouns that can be used to demonstrate data being viewed by a manager.
     */
    buzz_noun: string[];
    /**
     * Business/products related verbs that can be used to demonstrate data being viewed by a manager.
     */
    buzz_verb: string[];
    /**
     * Catchphrase adjectives that can be displayed to an end user.
     */
    adjective: string[];
    /**
     * Catchphrase descriptors that can be displayed to an end user.
     */
    descriptor: string[];
    /**
     * A list of patterns used to generate company names.
     */
    name_pattern: string[];
    /**
     * Catchphrase nouns that can be displayed to an end user.
     */
    noun: string[];
    /**
     * Company/Business entity types.
     *
     * @deprecated Use \`faker.company.name\` instead.
     */
    suffix: string[];
  }>;
  type DatabaseDefinition = LocaleEntry<{
    /**
     * Database engines.
     */
    engine: string[];
    /**
     * Database collations.
     */
    collation: string[];
    /**
     * Column names.
     */
    column: string[];
    /**
     * Column types.
     */
    type: string[];
  }>;
  type DateDefinition = LocaleEntry<{
    /**
     * The translations for months (January - December).
     */
    month: DateEntryDefinition;
    /**
     * The translations for weekdays (Sunday - Saturday).
     */
    weekday: DateEntryDefinition;
  }>;
  interface DateEntryDefinition {
    /**
     * The long name of the entry.
     */
    wide: string[];
    /**
     * The short name/abbreviation of the entry.
     */
    abbr: string[];
    /**
     * The wide name of the entry when used in context. If absent wide will be used instead.
     * It is used to specify a word in context, which may differ from a stand-alone word.
     */
    wide_context?: string[];
    /**
     * The short name/abbreviation name of the entry when used in context. If absent abbr will be used instead.
     * It is used to specify a word in context, which may differ from a stand-alone word.
     */
    abbr_context?: string[];
  }
  type FinanceDefinition = LocaleEntry<{
    /**
     * The types of accounts/purposes of an account (e.g. \`Savings\` account).
     */
    account_type: string[];
    /**
     * The pattern by (lowercase) issuer name used to generate credit card codes.
     * \`L\` will be replaced by the check bit.
     *
     * @see faker.helpers.replaceCreditCardSymbols()
     */
    credit_card: {
      [issuer: string]: string[];
    };
    /**
     * Currencies including their name, code and symbol (e.g. \`US Dollar\` / \`USD\` / \`$\`).
     */
    currency: Currency[];
    /**
     * Types of transactions (e.g. \`deposit\`).
     */
    transaction_type: string[];
  }>;
  type HackerDefinition = LocaleEntry<{
    /**
     * Generic computer related abbreviations (e.g. \`RAM\`, \`EXE\`).
     */
    abbreviation: string[];
    /**
     * Some computer related adjectives or descriptors (e.g. \`digital\`, \`bluetooth\`)
     */
    adjective: string[];
    /**
     * Some computer related verbs for continuous actions (en: \`ing\` suffix; e.g. \`hacking\`).
     */
    ingverb: string[];
    /**
     * Some computer related nouns (e.g. \`protocol\`, \`sensor\`).
     */
    noun: string[];
    /**
     * Some phrases that will be injected with random hacker words.
     * May use any of the HackerDefinition keys wrapped in double braces
     * (e.g. \`I'm {{ingverb}} {{adjective}} {{noun}}\`).
     *
     * @see faker.helpers.mustache()
     */
    phrase: string[];
    /**
     * Some computer related verbs (e.g. \`hack\`).
     */
    verb: string[];
  }>;
  type InternetDefinition = LocaleEntry<{
    /**
     * Common top level and similar domains (e.g \`de\`, \`co.uk\`).
     */
    domain_suffix: string[];
    /**
     * Some email domains containing \`example\` (e.g. \`example.com\`).
     */
    example_email: string[];
    /**
     * Some free-mail domains used in that country (e.g. \`gmail.de\`).
     */
    free_email: string[];
    /**
     * List of all fully-qualified emojis.
     */
    emoji: Record<EmojiType, string[]>;
    /**
     * List of some HTTP status codes.
     */
    http_status_code: Record<HTTPStatusCodeType, number[]>;
  }>;
  type LocationDefinition = LocaleEntry<{
    /**
     * Postcodes patterns by state
     */
    postcode_by_state: {
      [state: string]: {
        min: number;
        max: number;
      };
    };
    /**
     * Postcodes patterns.
     */
    postcode: string | string[];
    /**
     * The patterns to generate city names.
     */
    city_pattern: string[];
    /**
     * The names of actual cities.
     */
    city_name: string[];
    /**
     * Common city prefixes.
     */
    city_prefix: string[];
    /**
     * Common city suffixes.
     */
    city_suffix: string[];
    /**
     * The names of all countries.
     */
    country: string[];
    /**
     * The [ISO_3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) country codes.
     */
    country_code: Array<{
      alpha2: string;
      alpha3: string;
    }>;
    /**
     * The names of this country's states, or other first-level administrative areas.
     */
    state: string[];
    /**
     * The abbreviated names of this country's states, or other first-level administrative areas.
     */
    state_abbr: string[];
    /**
     * The names of counties, or other second-level administrative areas, inside the country's states.
     */
    county: string[];
    /**
     * The names of the compass directions.
     * First the 4 cardinal directions, then the 4 ordinal directions.
     */
    direction: string[];
    /**
     * The abbreviated names of the compass directions.
     * First the 4 cardinal directions, then the 4 ordinal directions.
     */
    direction_abbr: string[];
    /**
     * The pattern used to generate building numbers. Since building numbers rarely start with 0, any consecutive # characters will be replaced by a number without a leading zero.
     */
    building_number: string[];
    /**
     * The patterns to generate street names.
     */
    street_pattern: string[];
    /**
     * The names of actual streets.
     */
    street_name: string[];
    /**
     * Common street prefixes.
     */
    street_prefix: string[];
    /**
     * Common street suffixes.
     */
    street_suffix: string[];
    /**
     * The pattern used to generate street addresses.
     */
    street_address: {
      /**
       * The fake pattern to generate only the street address.
       */
      normal: string;
      /**
       * The fake pattern to generate the full street address including the secondary address.
       */
      full: string;
    };
    /**
     * The address "inside" an address/e.g. an apartment or office. Since these rarely start with 0, any consecutive # characters will be replaced by a number without a leading zero.
     */
    secondary_address: string[];
    /**
     * A list of timezones names.
     */
    time_zone: string[];
  }>;
  type LoremDefinition = LocaleEntry<{
    /**
     * Lorem words used to generate dummy texts.
     */
    words: string[];
  }>;
  type PreBuiltMetadataDefinition = {
    /**
     * The English name of the language (and the specific country, if defined).
     */
    title: string;
    /**
     * The full code of the locale, including the country code if applicable.
     */
    code: string;
    /**
     * The endonym (native name) of the language (and the specific country, if defined).
     *
     * @see https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_and_their_capitals_in_native_languages
     */
    endonym: string;
    /**
     * The ISO 639-1 code of the language.
     *
     * @see https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
     */
    language: string;
    /**
     * The specific variant of the language. This usually refers to a dialect or slang.
     */
    variant?: string;
    /**
     * The direction of the language, either 'ltr' (left to right) or 'rtl' (right to left).
     */
    dir: "ltr" | "rtl";
    /**
     * The ISO 15924 code of the script.
     *
     * @see https://en.wikipedia.org/wiki/ISO_15924
     */
    script: string;
  };
  type PreBuiltMetadataDefinitionForCountry = PreBuiltMetadataDefinition & {
    /**
     * The ISO 3166-1 alpha-2 code of the country.
     *
     * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
     */
    country: string;
  };
  type MetadataDefinition = LocaleEntry<PreBuiltMetadataDefinitionForCountry>;
  type MusicDefinition = LocaleEntry<{
    /**
     * The names of some music genres.
     */
    genre: string[];
    /**
     * The names of some songs.
     */
    song_name: string[];
  }>;
  type PersonDefinition = LocaleEntry<{
    gender: string[];
    sex: string[];
    prefix: string[];
    female_prefix: string[];
    male_prefix: string[];
    first_name: string[];
    female_first_name: string[];
    male_first_name: string[];
    middle_name: string[];
    female_middle_name: string[];
    male_middle_name: string[];
    last_name: string[];
    female_last_name: string[];
    male_last_name: string[];
    suffix: string[];
    /**
     * A weighted list of patterns used to generate names.
     */
    name: Array<{
      value: string;
      weight: number;
    }>;
    /**
     * A weighted list of patterns used to generate last names.
     */
    last_name_pattern: Array<{
      value: string;
      weight: number;
    }>;
    male_last_name_pattern: Array<{
      value: string;
      weight: number;
    }>;
    female_last_name_pattern: Array<{
      value: string;
      weight: number;
    }>;
    bio_pattern: string[];
    title: PersonTitleDefinition;
    western_zodiac_sign: string[];
  }>;
  type PersonTitleDefinition = LocaleEntry<{
    descriptor: string[];
    job: string[];
    level: string[];
  }>;
  type PhoneNumberDefinition = LocaleEntry<{
    /**
     * Some patterns used to generate phone numbers.
     * \`#\` will be replaced by a random digit (0-9).
     * \`!\` will be replaced by a random digit (2-9).
     * (e.g. \`!##-!##-####\` -> 272-285-0453)
     *
     * @see faker.helpers.replaceSymbolWithNumber(format)
     */
    formats: string[];
  }>;
  type ScienceDefinition = LocaleEntry<{
    /**
     * Some science units.
     */
    unit: ReadonlyArray<Unit>;
    /**
     * Some periodic table element information.
     */
    chemicalElement: ReadonlyArray<ChemicalElement>;
  }>;
  type SystemDefinition = LocaleEntry<{
    /**
     * Returns some common file paths.
     */
    directoryPaths: string[];
    /**
     * The mime type definitions with some additional information.
     */
    mimeTypes: {
      [mimeType: string]: SystemMimeTypeEntryDefinition;
    };
  }>;
  interface SystemMimeTypeEntryDefinition {
    extensions: string[];
  }
  type VehicleDefinition = LocaleEntry<{
    /**
     * Some types of bicycles.
     */
    bicycle_type: string[];
    /**
     * Some types of fuel (e.g. \`Gasoline\`).
     */
    fuel: string[];
    /**
     * Some brands of manufactures (e.g. \`Tesla\`).
     */
    manufacturer: string[];
    /**
     * Some names of models (e.g. \`Fiesta\`).
     */
    model: string[];
    /**
     * Some types of vehicles (e.g. \`Minivan\`).
     */
    type: string[];
  }>;
  type WordDefinition = LocaleEntry<{
    adjective: string[];
    adverb: string[];
    conjunction: string[];
    interjection: string[];
    noun: string[];
    preposition: string[];
    verb: string[];
  }>;
  type LocaleEntry<TCategoryDefinition extends Record<string, unknown>> = {
    [P in keyof TCategoryDefinition]?: TCategoryDefinition[P] | null;
  } & Record<string, unknown>;
  type LocaleDefinition = {
    metadata?: MetadataDefinition;
    airline?: AirlineDefinition;
    animal?: AnimalDefinition;
    color?: ColorDefinition;
    commerce?: CommerceDefinition;
    company?: CompanyDefinition;
    database?: DatabaseDefinition;
    date?: DateDefinition;
    finance?: FinanceDefinition;
    hacker?: HackerDefinition;
    internet?: InternetDefinition;
    location?: LocationDefinition;
    lorem?: LoremDefinition;
    music?: MusicDefinition;
    person?: PersonDefinition;
    phone_number?: PhoneNumberDefinition;
    science?: ScienceDefinition;
    system?: SystemDefinition;
    vehicle?: VehicleDefinition;
    word?: WordDefinition;
  } & Record<string, Record<string, unknown> | undefined>;
  type AirlineDefinition = LocaleEntry<{
    /**
     * Some airline information
     */
    airline: Airline[];
    /**
     * Some airplane information
     */
    airplane: Airplane[];
    /**
     * Some airport information
     */
    airport: Airport[];
  }>;
  type LocaleProxy = Readonly<{
    [key in keyof LocaleDefinition]-?: LocaleProxyCategory<LocaleDefinition[key]>;
  }>;
  type LocaleProxyCategory<T> = Readonly<{
    [key in keyof T]-?: LocaleProxyEntry<T[key]>;
  }>;
  type LocaleProxyEntry<T> = unknown extends T ? T : Readonly<NonNullable<T>>;
  /**
   * This is Faker's main class containing all modules that can be used to generate data.
   *
   * Please have a look at the individual modules and methods for more information and examples.
   *
   * @example
   * import { faker } from '@faker-js/faker';
   * // const { faker } = require('@faker-js/faker');
   *
   * // faker.seed(1234);
   *
   * faker.person.firstName(); // 'John'
   * faker.person.lastName(); // 'Doe'
   * @example
   * import { Faker, es } from '@faker-js/faker';
   * // const { Faker, es } = require('@faker-js/faker');
   *
   * // create a Faker instance with only es data and no en fallback (=> smaller bundle size)
   * const customFaker = new Faker({ locale: [es] });
   *
   * customFaker.person.firstName(); // 'Javier'
   * customFaker.person.lastName(); // 'Ocampo Corrales'
   *
   * customFaker.music.genre(); // throws Error as this data is not available in \`es\`
   */
  export declare class Faker {
    readonly rawDefinitions: LocaleDefinition;
    readonly definitions: LocaleProxy;
    private _defaultRefDate;
    /**
     * Gets a new reference date used to generate relative dates.
     */
    get defaultRefDate(): () => Date;
    /**
     * Sets the \`refDate\` source to use if no \`refDate\` date is passed to the date methods.
     *
     * @param dateOrSource The function or the static value used to generate the \`refDate\` date instance.
     * The function must return a new valid \`Date\` instance for every call.
     * Defaults to \`() => new Date()\`.
     *
     * @see [Reproducible Results](https://fakerjs.dev/guide/usage.html#reproducible-results)
     * @see faker.seed() for reproducible results.
     *
     * @example
     * faker.seed(1234);
     *
     * // Default behavior
     * // faker.setDefaultRefDate();
     * faker.date.past(); // Changes based on the current date/time
     *
     * // Use a static ref date
     * faker.setDefaultRefDate(new Date('2020-01-01'));
     * faker.date.past(); // Reproducible '2019-07-03T08:27:58.118Z'
     *
     * // Use a ref date that changes every time it is used
     * let clock = new Date("2020-01-01").getTime();
     * faker.setDefaultRefDate(() => {
     *   clock += 1000; // +1s
     *   return new Date(clock);
     * });
     *
     * faker.defaultRefDate() // 2020-01-01T00:00:01Z
     * faker.defaultRefDate() // 2020-01-01T00:00:02Z
     */
    setDefaultRefDate(dateOrSource?: string | Date | number | (() => Date)): void;
    /**
     * @deprecated Use the modules specific to the type of data you want to generate instead.
     */
    readonly random: RandomModule;
    readonly helpers: HelpersModule;
    readonly datatype: DatatypeModule;
    readonly airline: AirlineModule;
    readonly animal: AnimalModule;
    readonly color: ColorModule;
    readonly commerce: CommerceModule;
    readonly company: CompanyModule;
    readonly database: DatabaseModule;
    readonly date: DateModule;
    readonly finance: FinanceModule;
    readonly git: GitModule;
    readonly hacker: HackerModule;
    readonly image: ImageModule;
    readonly internet: InternetModule;
    readonly location: LocationModule;
    readonly lorem: LoremModule;
    readonly music: MusicModule;
    readonly person: PersonModule;
    readonly number: NumberModule;
    readonly phone: PhoneModule;
    readonly science: ScienceModule;
    readonly string: StringModule;
    readonly system: SystemModule;
    readonly vehicle: VehicleModule;
    readonly word: WordModule;
    /** @deprecated Use {@link Faker#location} instead */
    get address(): LocationModule;
    /** @deprecated Use {@link Faker#person} instead */
    get name(): PersonModule;
    /**
     * Creates a new instance of Faker.
     *
     * In most cases you should use one of the prebuilt Faker instances instead of the constructor, for example \`fakerDE\`, \`fakerFR\`, ...
     *
     * You only need to use the constructor if you need custom fallback logic or a custom locale.
     *
     * For more information see our [Localization Guide](https://fakerjs.dev/guide/localization.html).
     *
     * @param options The options to use.
     * @param options.locale The locale data to use.
     *
     * @example
     * import { Faker, es } from '@faker-js/faker';
     * // const { Faker, es } = require('@faker-js/faker');
     *
     * // create a Faker instance with only es data and no en fallback (=> smaller bundle size)
     * const customFaker = new Faker({ locale: [es] });
     *
     * customFaker.person.firstName(); // 'Javier'
     * customFaker.person.lastName(); // 'Ocampo Corrales'
     *
     * customFaker.music.genre(); // throws Error as this data is not available in \`es\`
     */
    constructor(options: {
      /**
       * The locale data to use for this instance.
       * If an array is provided, the first locale that has a definition for a given property will be used.
       *
       * @see mergeLocales
       */
      locale: LocaleDefinition | LocaleDefinition[];
    });
    /**
     * Creates a new instance of Faker.
     *
     * In most cases you should use one of the prebuilt Faker instances instead of the constructor, for example \`fakerDE\`, \`fakerFR\`, ...
     *
     * You only need to use the constructor if you need custom fallback logic or a custom locale.
     *
     * For more information see our [Localization Guide](https://fakerjs.dev/guide/localization.html).
     *
     * @param options The options to use.
     * @param options.locales The locale data to use.
     * @param options.locale The name of the main locale to use.
     * @param options.localeFallback The name of the fallback locale to use.
     *
     * @deprecated Use \`new Faker({ locale: [locale, localeFallback] })\` instead.
     */
    constructor(options: {
      locales: Record<string, LocaleDefinition>;
      locale?: string;
      localeFallback?: string;
    });
    /**
     * Creates a new instance of Faker.
     *
     * In most cases you should use one of the prebuilt Faker instances instead of the constructor, for example \`fakerDE\`, \`fakerFR\`, ...
     *
     * You only need to use the constructor if you need custom fallback logic or a custom locale.
     *
     * For more information see our [Localization Guide](https://fakerjs.dev/guide/localization.html).
     *
     * @param options The options to use.
     * @param options.locale The locale data to use or the name of the main locale.
     * @param options.locales The locale data to use.
     * @param options.localeFallback The name of the fallback locale to use.
     *
     * @example
     * import { Faker, es } from '@faker-js/faker';
     * // const { Faker, es } = require('@faker-js/faker');
     *
     * // create a Faker instance with only es data and no en fallback (=> smaller bundle size)
     * const customFaker = new Faker({ locale: [es] });
     *
     * customFaker.person.firstName(); // 'Javier'
     * customFaker.person.lastName(); // 'Ocampo Corrales'
     *
     * customFaker.music.genre(); // throws Error as this data is not available in \`es\`
     */
    constructor(options: {
      /**
       * The locale data to use for this instance.
       * If an array is provided, the first locale that has a definition for a given property will be used.
       *
       * @see mergeLocales
       */
      locale: LocaleDefinition | LocaleDefinition[];
    } | {
      /**
       * The locale data to use for this instance.
       *
       * @deprecated Use \`new Faker({ locale: [locale, localeFallback] })\` instead.
       */
      locales: Record<string, LocaleDefinition>;
      /**
       * The name of the main locale to use.
       *
       * @default 'en'
       *
       * @deprecated Use \`new Faker({ locale: [locale, localeFallback] })\` instead.
       */
      locale?: string;
      /**
       * The name of the fallback locale to use.
       *
       * @default 'en'
       *
       * @deprecated Use \`new Faker({ locale: [locale, localeFallback] })\` instead.
       */
      localeFallback?: string;
    });
    /**
     * Sets the seed or generates a new one.
     *
     * Please note that generated values are dependent on both the seed and the
     * number of calls that have been made since it was set.
     *
     * This method is intended to allow for consistent values in tests, so you
     * might want to use hardcoded values as the seed.
     *
     * In addition to that it can be used for creating truly random tests
     * (by passing no arguments), that still can be reproduced if needed,
     * by logging the result and explicitly setting it if needed.
     *
     * @param seed The seed to use. Defaults to a random number.
     *
     * @returns The seed that was set.
     *
     * @see [Reproducible Results](https://fakerjs.dev/guide/usage.html#reproducible-results)
     * @see faker.setDefaultRefDate() when generating relative dates.
     *
     * @example
     * // Consistent values for tests:
     * faker.seed(42)
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * faker.seed(42)
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * // Random but reproducible tests:
     * // Simply log the seed, and if you need to reproduce it, insert the seed here
     * console.log('Running test with seed:', faker.seed());
     */
    seed(seed?: number): number;
    /**
     * Sets the seed array.
     *
     * Please note that generated values are dependent on both the seed and the
     * number of calls that have been made since it was set.
     *
     * This method is intended to allow for consistent values in a tests, so you
     * might want to use hardcoded values as the seed.
     *
     * In addition to that it can be used for creating truly random tests
     * (by passing no arguments), that still can be reproduced if needed,
     * by logging the result and explicitly setting it if needed.
     *
     * @param seedArray The seed array to use.
     *
     * @returns The seed array that was set.
     *
     * @see [Reproducible Results](https://fakerjs.dev/guide/usage.html#reproducible-results)
     * @see faker.setDefaultRefDate() when generating relative dates.
     *
     * @example
     * // Consistent values for tests:
     * faker.seed([42, 13, 17])
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * faker.seed([42, 13, 17])
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * // Random but reproducible tests:
     * // Simply log the seed, and if you need to reproduce it, insert the seed here
     * console.log('Running test with seed:', faker.seed());
     */
    seed(seedArray: number[]): number[];
    /**
     * Sets the seed or generates a new one.
     *
     * Please note that generated values are dependent on both the seed and the
     * number of calls that have been made since it was set.
     *
     * This method is intended to allow for consistent values in a tests, so you
     * might want to use hardcoded values as the seed.
     *
     * In addition to that it can be used for creating truly random tests
     * (by passing no arguments), that still can be reproduced if needed,
     * by logging the result and explicitly setting it if needed.
     *
     * @param seed The seed or seed array to use.
     *
     * @returns The seed that was set.
     *
     * @see [Reproducible Results](https://fakerjs.dev/guide/usage.html#reproducible-results)
     * @see faker.setDefaultRefDate() when generating relative dates.
     *
     * @example
     * // Consistent values for tests (using a number):
     * faker.seed(42)
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * faker.seed(42)
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * // Consistent values for tests (using an array):
     * faker.seed([42, 13, 17])
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * faker.seed([42, 13, 17])
     * faker.number.int(10); // 4
     * faker.number.int(10); // 8
     *
     * // Random but reproducible tests:
     * // Simply log the seed, and if you need to reproduce it, insert the seed here
     * console.log('Running test with seed:', faker.seed());
     */
    seed(seed?: number | number[]): number | number[];
    /**
     * Returns an object with metadata about the current locale.
     *
     * @example
     * import { faker, fakerES_MX } from '@faker-js/faker';
     * // const { faker, fakerES_MX } = require("@faker-js/faker")
     * faker.getMetadata(); // { title: 'English', code: 'en', language: 'en', endonym: 'English', dir: 'ltr', script: 'Latn' }
     * fakerES_MX.getMetadata(); // { title: 'Spanish (Mexico)', code: 'es_MX', language: 'es', endonym: 'Español (México)', dir: 'ltr', script: 'Latn', country: 'MX' }
     */
    getMetadata(): MetadataDefinition;
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private get locales();
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private set locales(value);
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private get locale();
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private set locale(value);
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private get localeFallback();
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private set localeFallback(value);
    /**
     * Do NOT use. This property has been removed.
     *
     * @deprecated Use the constructor instead.
     */
    private setLocale;
  }
  export type FakerOptions = ConstructorParameters<typeof Faker>[0];

  export const faker: Faker
}
`;
