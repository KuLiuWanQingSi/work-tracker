import type { DatasourceEntryConfiguration } from "@/types/datasource-entry-details";

export interface DatasourceEntryAPI {
  get_configuration: () => DatasourceEntryConfiguration | null;
}

export interface EntriesConfiguration {
  image_size?: { width: number; height: number };
  entries: DatasourceEntryConfiguration[];
}

export interface StringEntryData {
  value: string;
}
export interface TagEntryData {
  tags: number[];
}
export interface RatingEntryData {
  score: number;
  comment?: string;
}
export type EntryData = StringEntryData | TagEntryData | RatingEntryData;

export interface InternalRatingEntryData {
  score: number;
  comment: string;
  use_comment: boolean;
}
export interface InternalTagEntryData {
  tags: (number | string)[];
}
export type InternalEntryData = StringEntryData | InternalTagEntryData | InternalRatingEntryData;
export type InternalDataItem = {
  image?: { name: string; index: number };
  entries: Map<string, InternalEntryData>;
};
