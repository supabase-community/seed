import { type ConnectCallback, type ScalarField } from "../plan/types.js";

export type UserModelsData = Record<string, ScalarField>;

export type UserModels = Record<
  string,
  { connect?: ConnectCallback; data?: UserModelsData }
>;
