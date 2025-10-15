// forward types
export type { Argon2HashWorkerParameters, Argon2HashWorkerResult } from "./argon2-hash-worker";

import type { Argon2HashWorkerParameters, Argon2HashWorkerResult } from "./argon2-hash-worker";
import Argon2Worker from "./argon2-hash-worker?worker&inline";

export function argon2_hash(parameters: Argon2HashWorkerParameters): {
  promise: Promise<Argon2HashWorkerResult>;
  canceler: () => void;
} {
  const worker = new Argon2Worker();
  let resolver: ((value: Argon2HashWorkerResult | PromiseLike<Argon2HashWorkerResult>) => void) | null = null;
  const working_promise = new Promise<Argon2HashWorkerResult>((resolve, _) => {
    resolver = resolve;
    worker.addEventListener("message", (event) => {
      const result: Argon2HashWorkerResult = event.data;
      // the worker has to be killed anyway as it seems that it is leaking memory
      worker.terminate();
      resolve(result);
    });
    worker.postMessage({ ...parameters });
  });
  return {
    promise: working_promise,
    canceler: () => {
      worker.terminate();
      if (resolver === null) {
        return;
      }
      resolver({ succeed: false, error_code: -1000, error_message: "canceled" });
    },
  };
}
