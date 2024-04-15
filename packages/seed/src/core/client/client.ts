import { type SelectConfig } from "#config/seedConfig/selectConfig.js";
import { type DialectId } from "#dialects/dialects.js";
import { type DataModel } from "../dataModel/types.js";
import { type Fingerprint } from "../fingerprint/types.js";
import { getInitialConstraints } from "../plan/constraints.js";
import { Plan } from "../plan/plan.js";
import { type PlanInputs, type PlanOptions } from "../plan/types.js";
import { captureRuntimeEvent } from "../runtime/captureRuntimeEvent.js";
import { type Store } from "../store/store.js";
import { type UserModels } from "../userModels/types.js";
import { mergeUserModels } from "../userModels/userModels.js";
import { type ClientState, type SeedClientOptions } from "./types.js";

const noop = () => ({});

export abstract class SeedClientBase implements SeedClient {
  readonly createStore: (dataModel: DataModel) => Store;
  dataModel: DataModel;
  readonly emit: (event: string) => void;
  readonly fingerprint: Fingerprint;
  readonly initialUserModels: UserModels;
  readonly runStatements: (statements: Array<string>) => Promise<void>;
  state: ClientState;
  readonly userModels: UserModels;

  constructor(props: {
    adapterPatchUserModels: (props: {
      dataModel: DataModel;
      userModels: UserModels;
    }) => UserModels;
    createStore: (dataModel: DataModel) => Store;
    dataModel: DataModel;
    emit?: (event: string) => void;
    fingerprint: Fingerprint;
    options?: SeedClientOptions;
    runStatements: (statements: Array<string>) => Promise<void>;
    userModels: UserModels;
  }) {
    this.emit = props.emit ?? noop;

    this.createStore = props.createStore;
    this.runStatements = props.runStatements;
    this.fingerprint = props.fingerprint;
    this.dataModel = props.dataModel;
    this.initialUserModels = mergeUserModels(
      props.userModels,
      props.options?.models ?? {},
    );

    this.userModels = props.adapterPatchUserModels({
      dataModel: this.dataModel,
      userModels: mergeUserModels(
        props.userModels,
        props.options?.models ?? {},
      ),
    });

    this.state = this.getInitialState();

    Object.keys(props.dataModel.models).forEach((model) => {
      // @ts-expect-error dynamic methods creation
      this[model] = (inputs: PlanInputs["inputs"], options?: PlanOptions) => {
        return new Plan({
          createStore: this.createStore,
          emit: this.emit,
          ctx: this.state,
          runStatements: props.runStatements,
          dataModel: props.dataModel,
          userModels: mergeUserModels(this.userModels, options?.models ?? {}),
          fingerprint: this.fingerprint,
          plan: {
            model,
            inputs,
          },
          options,
        });
      };
    });
  }

  getInitialState(): ClientState {
    return {
      constraints: getInitialConstraints(this.dataModel),
      seeds: {},
      store: this.createStore(this.dataModel),
    };
  }

  get $store() {
    return this.state.store._store;
  }

  abstract $resetDatabase(selectConfig?: SelectConfig): Promise<void>;

  abstract $syncDatabase(): Promise<void>;
}

interface SeedClient {
  $resetDatabase: (selectConfig?: SelectConfig) => Promise<void>;

  $store: Store["_store"];

  $syncDatabase: () => Promise<void>;
}

export const setupClient = async <Client extends SeedClient>(props: {
  createClient: () => Client | Promise<Client>;
  dialect: DialectId;
}): Promise<Client> => {
  const { createClient, dialect } = props;

  const promisedEventCapture = captureRuntimeEvent("$action:client:create", {
    dialect,
  });

  const seed = await createClient();

  await seed.$syncDatabase();

  await promisedEventCapture;
  return seed;
};

export type GetSeedClient = (props: {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  seedConfigPath: string;
  userModels: UserModels;
}) => (options?: SeedClientOptions) => Promise<SeedClient>;
