import { hash as argon2, ArgonType } from "argon2-browser/dist/argon2-bundled.min.js";

export type Argon2HashWorkerParameters = {
  payload: Uint8Array;
  salt: Uint8Array;
  time: number;
  memory: number;
  parallelism: number;
  hash_length: number;
};

export type Argon2HashWorkerResult =
  | { succeed: true; hash: Uint8Array }
  | { succeed: false; message: string };

self.addEventListener("message", event => {
  const parameters: Argon2HashWorkerParameters = event.data;
  const converted_parameters = {
    pass: parameters.payload,
    salt: parameters.salt,
    time: parameters.time,
    mem: Math.floor(parameters.memory / 1024),
    hashLen: parameters.hash_length,
    parallelism: parameters.parallelism,
    type: ArgonType.Argon2id,
  };
  argon2(converted_parameters)
    .then(result => {
      self.postMessage({ succeed: true, hash: result.hash });
    })
    .catch(error => {
      const message = error.code === undefined ? `${error}` : `${error.code}: ${error.message}`;
      self.postMessage({ succeed: false, message });
    });
});
