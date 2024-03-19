import { Separator, select } from "@inquirer/prompts";
import { gracefulExit } from "exit-hook";
import {
  type AdapterId,
  adapters,
  ormAdapters,
  postgresAdapters,
  sqliteAdapters,
} from "#adapters/index.js";
import { type Adapter } from "#adapters/types.js";
import { dim } from "#cli/lib/output.js";

export async function getAdapterFromPrompt() {
  const adapterId = await select<AdapterId>({
    message: "What database client would you like to use?",
    choices: [
      new Separator("ORM 🛠️"),
      ...formatAdapters(ormAdapters),
      new Separator("PostgreSQL 🐘"),
      ...formatAdapters(postgresAdapters),
      new Separator("SQLite 🪶"),
      ...formatAdapters(sqliteAdapters),
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
