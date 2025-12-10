import type { Result } from "./result";

export type ImageLoader = (name: string) => Promise<Result<Blob>>;
export interface DatasourceImages {
  pools: { name: string; bitmap: Uint8Array }[];
}
