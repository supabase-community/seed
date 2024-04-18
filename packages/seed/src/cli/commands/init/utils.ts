import { createHash } from "node:crypto";
import { readFile, watch } from "node:fs/promises";

async function getFileHash(filePath: string) {
  const data = await readFile(filePath);
  return createHash("md5").update(data).digest("hex");
}

const DEBOUNCE_MS = 200;
// Because nodejs watch api is broken, we need this to actually watch for
// file change and only trigger once for every actual change
// See: https://github.com/nodejs/node-v0.x-archive/issues/2126
export async function* watchFile(filePath: string) {
  let md5Previous: null | string = null;

  // We get the current hash of the file when calling the watch for first time
  // This avoid the watch to raise a change event when the file is first read
  try {
    md5Previous = await getFileHash(filePath);
  } catch (err) {
    // ignore error
  }

  let fsWait = false;
  const watcher = watch(filePath);

  for await (const { eventType, filename } of watcher) {
    if (!filename || eventType !== "change") continue;
    if (fsWait) continue;

    fsWait = true;
    setTimeout(() => {
      fsWait = false;
    }, DEBOUNCE_MS);

    try {
      const md5Current = await getFileHash(filePath);
      if (md5Current === md5Previous) {
        continue;
      }
      md5Previous = md5Current;
      yield { filename, eventType: "change", md5Hash: md5Current };
    } catch (err) {
      continue;
    }
  }
}
