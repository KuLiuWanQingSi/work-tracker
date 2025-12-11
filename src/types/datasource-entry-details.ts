import type { Sorting } from "@/definitions/sorting_types";

export type EntryType = "string" | "tag" | "rating";

export interface DatasourceEntryBaseConfiguration {
  name: string;
  sorting_method: Sorting;
  optional: boolean;
}

export interface DatasourceEntryStringExtraConfiguration {
  type: "string";
  unique: boolean;
}
export interface DatasourceEntryStringConfiguration
  extends DatasourceEntryBaseConfiguration, DatasourceEntryStringExtraConfiguration {}

export interface DatasourceEntryTagExtraConfiguration {
  type: "tag";
  exclusive: boolean;
}
export interface DatasourceEntryTagConfiguration
  extends DatasourceEntryBaseConfiguration, DatasourceEntryTagExtraConfiguration {}

export const RatingMetaConfiguration = {
  minimum_score: 2,
  maximum_score: 10,
};

export interface DatasourceEntryRatingExtraConfiguration {
  type: "rating";
  maximum_score: number;
  hints: string[] | null;
}
export interface DatasourceEntryRatingConfiguration
  extends DatasourceEntryBaseConfiguration, DatasourceEntryRatingExtraConfiguration {}

export type DatasourceEntryExtraConfiguration =
  | DatasourceEntryStringExtraConfiguration
  | DatasourceEntryTagExtraConfiguration
  | DatasourceEntryRatingExtraConfiguration;

export type DatasourceEntryConfiguration =
  | DatasourceEntryStringConfiguration
  | DatasourceEntryTagConfiguration
  | DatasourceEntryRatingConfiguration;

export interface DatasourceEntryDetailsAPI {
  SortingMethodsAvailable: [Sorting, ...Sorting[]];
}
