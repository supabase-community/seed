import { postgresDrivers } from "./postgres/drivers/index.js";
import { sqliteDrivers } from "./sqlite/drivers/index.js";

export const drivers = {
  ...postgresDrivers,
  ...sqliteDrivers,
};

export type DriverId = keyof typeof drivers;
