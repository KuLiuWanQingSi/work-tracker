import type { Datasource, DatasourceInternals, EncryptedDatasource } from "@/types/datasource";
import type { Argon2Configuration } from "@/types/datasource-crypto";
import type { ImageLoader } from "@/types/datasource-images";
import type { ImageFormatSpecification } from "@/types/image-types";
import { Result } from "@/types/result";
import { argon2_hash } from "./argon2-hash";

export const NonceLength = 12;

export async function wt_decrypt(
  key: CryptoKey,
  nonce: Uint8Array,
  data: Uint8Array,
): Promise<Result<Uint8Array>> {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce as BufferSource },
      key,
      data as BufferSource,
    );
    return Result.ok(new Uint8Array(decrypted));
  } catch (error) {
    return Result.error("Failed to decrypt", String(error));
  }
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
): Promise<Result<{ key: CryptoKey; raw_key: Uint8Array }>> {
  const encoded_password = typeof password === "string" ? new TextEncoder().encode(password) : password;
  const result = await argon2_hash({
    payload: encoded_password,
    salt: configurations.salt,
    time: configurations.iterations,
    memory: configurations.memory,
    parallelism: configurations.threads,
    hash_length: 32,
  }).promise;
  if (result.is_err()) {
    return result.erase_type();
  }
  const raw_key = result.unwrap();
  const key = await wt_import_key(raw_key, { encrypt: true, decrypt: true });
  return Result.ok({ key, raw_key });
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

export function load_datasource_phase1(source: string): Result<EncryptedDatasource> {
  try {
    return Result.ok(JSON.parse(source, parse_reviver) as EncryptedDatasource);
  } catch (error) {
    return Result.error("Failed to parse JSON", String(error));
  }
}
// finally decrypt the database
//  the credential may be a string, which will be interpreted as the user password, or an Uint8Array which
//  will be used directly as the raw key, i.e. the result after supplying the user password to the KDF
export async function load_datasource_phase2(
  encrypted_database: EncryptedDatasource,
  credential: string | Uint8Array,
  image_loader: ImageLoader,
): Promise<Result<Datasource>> {
  const user_key = await (async (): Promise<Result<CryptoKey>> => {
    if (typeof credential === "string") {
      const kdf_result = await get_key_from_password(credential, encrypted_database.protection.argon2);
      return kdf_result.map(({ key }) => key);
    }
    return Result.ok(await wt_import_key(credential, { encrypt: true, decrypt: true }));
  })();
  if (user_key.is_err()) {
    return user_key.erase_type();
  }
  const raw_database_key = await wt_decrypt(
    user_key.unwrap(),
    encrypted_database.protection.key_nonce,
    encrypted_database.protection.encrypted_key,
  );
  if (raw_database_key.is_err()) {
    return raw_database_key.erase_type();
  }
  const database_key = await wt_import_key(raw_database_key.unwrap(), { encrypt: true, decrypt: true });
  const encoded_database_internals = await wt_decrypt(
    database_key,
    encrypted_database.protection.data_nonce,
    encrypted_database.internals,
  );
  if (encoded_database_internals.is_err()) {
    return encoded_database_internals.erase_type();
  }
  const decoder = new TextDecoder();
  const internals = ((): Result<DatasourceInternals> => {
    try {
      const internals = JSON.parse(
        decoder.decode(encoded_database_internals.unwrap()),
        parse_reviver,
      ) as DatasourceInternals;
      return Result.ok(internals);
    } catch (error) {
      return Result.error("Failed to parse internal JSON", String(error));
    }
  })();
  if (internals.is_err()) {
    return internals.erase_type();
  }
  const database: Datasource = {
    runtime: {
      protection: {
        encrypted_key: encrypted_database.protection.encrypted_key,
        key: database_key,
        key_nonce: encrypted_database.protection.key_nonce,
        argon2: encrypted_database.protection.argon2,
      },
    },
    ...internals.unwrap(),
  };
  if (database.configurations.entry.image_size) {
    database.runtime.images = { loader: image_loader };
  }
  return Result.ok(database);
}

// decrypt the image
export async function open_image(
  encrypted_image: Blob,
  format: ImageFormatSpecification,
  key: CryptoKey,
): Promise<Result<Blob>> {
  const header_length = format.header_length;
  const array = await encrypted_image.bytes();
  const image_header = array.slice(0, header_length);
  const nonce = array.slice(header_length, header_length + NonceLength);
  const encrypted_data = array.slice(header_length + NonceLength);
  const data = await wt_decrypt(key, nonce, encrypted_data);
  return data.map(image_body => new Blob([image_header, image_body as BufferSource]));
}
