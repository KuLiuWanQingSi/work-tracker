import type { EntryData } from "./datasource-entry";

export interface RuntimeDataItem {
  image?: Blob;
}

export interface DataItem {
  image?: { name: string; index: number };
  entries?: Map<string, EntryData>;
}
