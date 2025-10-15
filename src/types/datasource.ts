import type { Argon2Configuration } from "./datasource-crypto";
import type { DataItem } from "./datasource-data";
import type { EntriesConfiguration } from "./datasource-entry";
import type { GlobalConfiguration } from "./datasource-global";
import type { DatasourceImages, ImageLoader } from "./datasource-images";

// restriction on typing: any field accessible from Datasource, except those under Datasource.runtime,
//  and any field under EncryptedDatasource, when fully expanded into builtin types, MUST take one of the
//  types listed below, in which T can be any type listed:
//   number
//   string
//   Uint8Array
//   Map<string, T>
//   T[]

export interface DatasourceRuntime {
  protection: {
    encrypted_key: Uint8Array;
    key: CryptoKey;
    key_nonce: Uint8Array;
    argon2: Argon2Configuration;
  };
  images?: {
    loader: ImageLoader;
  };
}
export interface DatasourceInternals {
  protection: { encrypted_counter: number };
  configurations: {
    global: GlobalConfiguration;
    entry: EntriesConfiguration;
  };
  images?: DatasourceImages;
  tags?: Map<string, string[]>;

  // data are stored in a mapping from is id (also referred as runtime_id) since this id was not stored
  //  into the database in early implements
  // this id is the name (stem) of image file storing the image of corresponding item, if one is configured
  //  to be included
  data: Map<string, DataItem>;
}

export interface Datasource extends DatasourceInternals {
  runtime: DatasourceRuntime;
}

export interface EncryptedDatasource {
  protection: {
    encrypted_key: Uint8Array;
    key_nonce: Uint8Array;
    data_nonce: Uint8Array;
    argon2: Argon2Configuration;
  };
  internals: Uint8Array;
}
