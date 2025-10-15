export type ImageLoader = (name: string) => Promise<Blob> | null;
export interface DatasourceImages {
  pools: { name: string; bitmap: Uint8Array }[];
}
