import { Separator, select } from "@inquirer/prompts";
import { gracefulExit } from "exit-hook";
import {
  type AdapterId,
  adapters,
  mysqlAdapters,
  ormAdapters,
  postgresAdapters,
  sqliteAdapters,
} from "#adapters/index.js";
import { type Adapter } from "#adapters/types.js";
import { dim } from "#cli/lib/output.js";

export async function selectAdapterFromPrompt() {
  const adapterId = await select<AdapterId>({
    message: "Select an adapter to connect Seed to your database:",
    choices: [
      new Separator("ORM 🛠️"),
      ...formatAdapters(ormAdapters),
      new Separator("PostgreSQL 🐘"),
      ...formatAdapters(postgresAdapters),
      new Separator("SQLite 🪶"),
      ...formatAdapters(sqliteAdapters),
      new Separator("MySQL 🐬"),
      ...formatAdapters(mysqlAdapters),
    ],
  }).catch(() => {
    gracefulExit();
  });

  const adapter = adapters[adapterId];

  return adapter;
}

function formatAdapters(adapters: Record<string, Adapter>) {
  return Object.values(adapters)
    .map(({ id, name, packageName }) => ({
      value: id as AdapterId,
      name: `${name} ${dim(`(${packageName})`)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
