import { emitKeypressEvents } from "node:readline";

export const listenForKeyPress = (targetKey: string) => {
  let resolve = () => {
    return;
  };

  let isCancelled = false;

  const promise = new Promise((resolver) => {
    resolve = () => {
      resolver(true);
    };
  });

  const listener = (_: unknown, key: { name: string } | undefined) => {
    if (key && key.name == targetKey) {
      cancel();
      resolve();
    }
  };

  const cancel = () => {
    if (isCancelled) {
      return;
    }

    isCancelled = true;
    process.stdin.removeListener("keypress", listener);
  };

  emitKeypressEvents(process.stdin);

  process.stdin.on("keypress", listener);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.resume();

  return {
    cancel,
    promise,
  };
};
