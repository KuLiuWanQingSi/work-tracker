import type { Datasource, DatasourceInternals, EncryptedDatasource } from "@/types/datasource";
import type { Argon2Configuration } from "@/types/datasource-crypto";
import type { ImageLoader } from "@/types/datasource-images";
import type { ImageFormatSpecification } from "@/types/image-types";
import { argon2_hash } from "./argon2-hash";

export const NonceLength = 12;

export async function wt_decrypt(key: CryptoKey, nonce: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce as BufferSource }, key, data as BufferSource),
  );
}
export async function wt_import_key(
  raw_key: Uint8Array,
  usages: { encrypt?: boolean; decrypt?: boolean },
): Promise<CryptoKey> {
  const usage: KeyUsage[] = [];
  if (usages.encrypt) {
    usage.push("encrypt");
  }
  if (usages.decrypt) {
    usage.push("decrypt");
  }
  return await crypto.subtle.importKey("raw", raw_key as BufferSource, "AES-GCM", false, usage);
}

export async function get_key_from_password(
  password: Uint8Array | string,
  configurations: Argon2Configuration,
): Promise<{ key: CryptoKey; raw_key: Uint8Array }> {
  const encoded_password = typeof password === "string" ? new TextEncoder().encode(password) : password;
  const result = await argon2_hash({
    payload: encoded_password,
    salt: configurations.salt,
    time: configurations.iterations,
    memory: configurations.memory,
    parallelism: configurations.threads,
    hash_length: 32,
  }).promise;
  if (!result.succeed) {
    throw new Error(result.error_message);
  }
  const raw_key = result.result;
  const key = await wt_import_key(raw_key, { encrypt: true, decrypt: true });
  return { key, raw_key };
}

function parse_reviver(key: string, value: any) {
  const UInt8ArrayMark = "base64://";
  const MapMark = "map://";
  if (typeof value === "string" && value.startsWith(UInt8ArrayMark)) {
    return Uint8Array.fromBase64(value.slice(UInt8ArrayMark.length));
  }
  if (Array.isArray(value) && value[0] === MapMark) {
    return new Map(value.slice(1));
  }
  return value;
}

export function load_datasource_phase1(source: string): EncryptedDatasource {
  return JSON.parse(source, parse_reviver) as EncryptedDatasource;
}
// finally decrypt the database
//  the credential may be a string, which will be interpreted as the user password, or an Uint8Array which
//  will be used directly as the raw key, i.e. the result after supplying the user password to the KDF
export async function load_datasource_phase2(
  encrypted_database: EncryptedDatasource,
  credential: string | Uint8Array,
  image_loader: ImageLoader,
): Promise<Datasource> {
  const user_key =
    typeof credential === "string"
      ? (await get_key_from_password(credential, encrypted_database.protection.argon2)).key
      : await wt_import_key(credential, { encrypt: true, decrypt: true });
  const raw_database_key = await wt_decrypt(
    user_key,
    encrypted_database.protection.key_nonce,
    encrypted_database.protection.encrypted_key,
  );
  const database_key = await wt_import_key(raw_database_key, { encrypt: true, decrypt: true });
  const encoded_database_internals = await wt_decrypt(
    database_key,
    encrypted_database.protection.data_nonce,
    encrypted_database.internals,
  );
  const decoder = new TextDecoder();
  const internals = JSON.parse(
    decoder.decode(encoded_database_internals),
    parse_reviver,
  ) as DatasourceInternals;
  const database: Datasource = {
    runtime: {
      protection: {
        encrypted_key: encrypted_database.protection.encrypted_key,
        key: database_key,
        key_nonce: encrypted_database.protection.key_nonce,
        argon2: encrypted_database.protection.argon2,
      },
    },
    ...internals,
  };
  if (database.configurations.entry.image_size) {
    database.runtime.images = { loader: image_loader };
  }
  return database;
}

// decrypt the image
export async function open_image(
  encrypted_image: Blob,
  format: ImageFormatSpecification,
  key: CryptoKey,
): Promise<Blob> {
  const header_length = format.header_length;
  const array = await encrypted_image.bytes();
  const image_header = array.slice(0, header_length);
  const nonce = array.slice(header_length, header_length + NonceLength);
  const encrypted_data = array.slice(header_length + NonceLength);
  const data = await wt_decrypt(key, nonce, encrypted_data);
  return new Blob([image_header, data as BufferSource]);
}
