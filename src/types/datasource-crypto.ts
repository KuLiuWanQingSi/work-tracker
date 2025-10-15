export interface Argon2Configuration {
  memory: number;
  iterations: number;
  threads: number;
  salt: Uint8Array;
}
export interface DataEncryptionKey {
  raw_key: Uint8Array;
  encrypted_key: Uint8Array;
  key_nonce: Uint8Array;
}
export interface CryptoConfiguration {
  argon2: Argon2Configuration;
  data_encryption: DataEncryptionKey;
}
