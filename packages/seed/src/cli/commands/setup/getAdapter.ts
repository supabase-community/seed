import { adapters } from "#adapters/index.js";
import { getInstalledDependencies } from "#config/utils.js";
import { getAdapterFromPrompt } from "./getAdapterFromPrompt.js";

export async function getAdapter() {
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
  return getAdapterFromPrompt();
}
