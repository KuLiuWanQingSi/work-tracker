import type { Argon2HashWorkerParameters, Argon2HashWorkerResult } from "./argon2-hash-worker";
import { Result } from "@/types/result";
import Argon2Worker from "./argon2-hash-worker?worker&inline";

export type { Argon2HashWorkerParameters } from "./argon2-hash-worker";
export type Argon2HashResult = Result<Uint8Array>;

export function argon2_hash(parameters: Argon2HashWorkerParameters): {
  promise: Promise<Argon2HashResult>;
  canceler: () => void;
} {
  const worker = new Argon2Worker();
  let resolver: ((value: Argon2HashResult | PromiseLike<Argon2HashResult>) => void) | null = null;
  const working_promise = new Promise<Argon2HashResult>((resolve, _) => {
    resolver = resolve;
    worker.addEventListener("message", event => {
      const result: Argon2HashWorkerResult = event.data;
      // the worker has to be killed anyway as it seems that it is leaking memory
      worker.terminate();
      if (result.succeed) {
        resolve(Result.ok<Uint8Array>(result.hash));
      } else {
        resolve(Result.error(result.message));
      }
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
      resolver(Result.ok<Uint8Array>(new Uint8Array(0)));
    },
  };
}
