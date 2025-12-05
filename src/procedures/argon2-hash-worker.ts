import { hash as argon2, ArgonType } from "argon2-browser/dist/argon2-bundled.min.js";

export type Argon2HashWorkerParameters = {
  payload: Uint8Array;
  salt: Uint8Array;
  time: number;
  memory: number;
  parallelism: number;
  hash_length: number;
};

type Argon2HashWorkerSucceedResult = {
  succeed: true;
  result: Uint8Array;
};

type Argon2HashWorkerFailedResult = {
  succeed: false;
  error_code: number;
  error_message: string;
};

export type Argon2HashWorkerResult = Argon2HashWorkerSucceedResult | Argon2HashWorkerFailedResult;

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
      self.postMessage({ succeed: true, result: result.hash });
    })
    .catch(error => {
      self.postMessage({ succeed: false, error_code: error.code, error_message: error.message });
    });
});
