import { emitKeypressEvents } from "node:readline";

export const listenForKeyPress = (targetKey: string) => {
  let resolve = () => {
    return;
  };

  const promise = new Promise((resolver) => {
    resolve = () => {
      resolver(true);
    };
  });

  let isCancelled = false;
  emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) process.stdin.setRawMode(true);

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

  process.stdin.on("keypress", listener);

  return {
    cancel,
    promise,
  };
};
