import { adapters } from "#adapters/index.js";
import { updateProjectConfig } from "#config/project/projectConfig.js";
import { getInstalledDependencies } from "#config/utils.js";
import { selectAdapterFromPrompt } from "./selectAdapterFromPrompt.js";

export async function getAdapter() {
  const adapter = await selectAdapter();
  await updateProjectConfig({ adapter: adapter.id });
  return adapter;
}

async function selectAdapter() {
  const installedDependencies = await getInstalledDependencies();

  // look for ORM-like adapters first
  if (installedDependencies["@prisma/client"]) {
    return adapters.prisma;
  }

  // look for library adapters next
  const libraryAdapters = Object.values(adapters).filter((a) =>
    Boolean(installedDependencies[a.packageName]),
  );

  // no ambiguity, return the adapter
  if (libraryAdapters.length === 1) {
    return libraryAdapters[0];
  }

  // if more than one or no adapter is found, prompt the user
  return selectAdapterFromPrompt();
}
