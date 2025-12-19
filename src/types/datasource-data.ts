import type { EntryData } from "./datasource-entry";

export interface RuntimeDataItem {
  image?: Blob;
}

export interface DataItem {
  // image is never optional is the database is configured to include an image for each item
  //  therefore, image will be undefined if and only if the database is configured to not include images
  image?: { name: string; index: number };
  // entries will be undefined if and only if the database has no entry configured
  //  entries will only include entries that are not empty: if A is an entry with type tag and is optional,
  //  for an item i with no tag specified on A, its entries field should not include the key A.
  //  That is, i.entries will not be undefined since there is at least one entries configured for the database
  //   and i.entries.get(A) will result in undefined, instead of a TagEntryData with [] as its tags field.
  entries?: Map<string, EntryData>;
}
