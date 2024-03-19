import { type DataModel } from "../dataModel/types.js";
import { type Fingerprint } from "../fingerprint/types.js";
import { getInitialConstraints } from "../plan/constraints.js";
import { Plan } from "../plan/plan.js";
import { type PlanInputs, type PlanOptions } from "../plan/types.js";
import { captureRuntimeEvent } from "../runtime/captureRuntimeEvent.js";
import { generateUserModelsSequences } from "../sequences/sequences.js";
import { type Store } from "../store/store.js";
import { type UserModels } from "../userModels/types.js";
import { mergeUserModels } from "../userModels/userModels.js";
import { type ClientState, type SeedClientOptions } from "./types.js";

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
    createStore: (dataModel: DataModel) => Store;
    dataModel: DataModel;
    emit?: (event: string) => void;
    fingerprint: Fingerprint;
    options?: SeedClientOptions;
    runStatements: (statements: Array<string>) => Promise<void>;
    userModels: UserModels;
  }) {
    this.emit =
      props.emit ??
      (() => {
        /* stub */
      });

    this.createStore = props.createStore;
    this.runStatements = props.runStatements;
    this.fingerprint = props.fingerprint;
    this.dataModel = props.dataModel;
    this.initialUserModels = mergeUserModels(
      props.userModels,
      props.options?.models ?? {},
    );

    this.userModels = mergeUserModels(
      props.userModels,
      props.options?.models ?? {},
    );
    this.state = SeedClientBase.getInitialState({
      createStore: this.createStore,
      dataModel: props.dataModel,
      userModels: this.userModels,
      initialUserModels: this.initialUserModels,
    });

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

  static getInitialState(props: {
    createStore: (dataModel: DataModel) => Store;
    dataModel: DataModel;
    initialUserModels?: UserModels;
    userModels: UserModels;
  }) {
    const initialUserModels = props.initialUserModels ?? props.userModels;
    const constraints = getInitialConstraints(props.dataModel);
    return {
      constraints,
      store: props.createStore(props.dataModel),
      seeds: {},
      sequences: generateUserModelsSequences(
        initialUserModels,
        props.userModels,
        props.dataModel,
      ),
    };
  }

  $reset() {
    this.state = SeedClientBase.getInitialState({
      createStore: this.createStore,
      dataModel: this.dataModel,
      userModels: this.userModels,
      initialUserModels: this.initialUserModels,
    });
  }

  get $store() {
    return this.state.store._store;
  }

  abstract $resetDatabase(
    selectConfig?: Record<string, boolean>,
  ): Promise<void>;

  abstract $syncDatabase(): Promise<void>;

  abstract $transaction(
    _cb: (snaplet: SeedClient) => Promise<void>,
  ): Promise<void>;
}

interface SeedClient {
  $reset: () => void;

  $resetDatabase: (selectConfig?: Record<string, boolean>) => Promise<void>;

  $store: Store["_store"];

  $syncDatabase: () => Promise<void>;

  $transaction: (_cb: (seed: SeedClient) => Promise<void>) => Promise<void>;
}

export const setupClient = async <Client extends SeedClient>(props: {
  createClient: () => Client | Promise<Client>;
  dialect: DataModel["dialect"];
}): Promise<Client> => {
  const { createClient, dialect } = props;

  const promisedEventCapture = captureRuntimeEvent("$action:client:create", {
    dialect,
  });

  const seed = await createClient();

  await seed.$syncDatabase();
  seed.$reset();

  await promisedEventCapture;
  return seed;
};
