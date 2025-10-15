import { Sorting } from "@/definitions/sorting_types";
import type { EntryData, RatingEntryData, StringEntryData, TagEntryData } from "@/types/datasource-entry";
import type {
  DatasourceEntryConfiguration,
  DatasourceEntryRatingConfiguration,
  DatasourceEntryStringConfiguration,
  DatasourceEntryTagConfiguration,
} from "@/types/datasource-entry-details";

function pick_numeric_part(value: string) {
  const match_result = value.match(/\d+/);
  return match_result === null ? null : match_result[0];
}

function pack_number_to_string(value: number): string {
  const integer = Math.round(value);
  const PaddingTarget = 18;
  return integer < 0
    ? `-${integer.toString().padStart(PaddingTarget, "0")}`
    : integer.toString().padStart(PaddingTarget + 1, "0");
}

export function sorting_number_to_string(value: string): string | null {
  const numeric_component = pick_numeric_part(value);
  return numeric_component === null ? numeric_component : pack_number_to_string(Number(numeric_component));
}
export function sorting_date_to_string(value: string): string | null {
  const timestamp = new Date(value).valueOf();
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return pack_number_to_string(timestamp);
}

function to_sorting_string(config: DatasourceEntryStringConfiguration, data: StringEntryData): string | null {
  switch (config.sorting_method) {
    case Sorting.AsDate:
      return sorting_date_to_string(data.value);
    case Sorting.AsNumber:
      return sorting_number_to_string(data.value);
    case Sorting.AsString:
      return data.value;
    default:
      return null;
  }
}
function to_sorting_rating(config: DatasourceEntryRatingConfiguration, data: RatingEntryData): string | null {
  switch (config.sorting_method) {
    case Sorting.AsNumber:
      return pack_number_to_string(data.score);
    default:
      return null;
  }
}
function to_sorting_tag(
  config: DatasourceEntryTagConfiguration,
  data: TagEntryData,
  tags: string[]
): string | null {
  if (config.sorting_method === Sorting.Disabled) {
    return null;
  }
  const padding_target = Math.ceil(Math.log10(tags.length));
  const result = data.tags.map((value) => value.toString().padStart(padding_target, "0")).join("");
  return result;
}

export function to_sorting(
  config: DatasourceEntryStringConfiguration,
  data: StringEntryData
): string | number | null;
export function to_sorting(config: DatasourceEntryRatingConfiguration, data: RatingEntryData): string | null;
export function to_sorting(
  config: DatasourceEntryTagConfiguration,
  data: TagEntryData,
  tags: string[]
): string | null;
export function to_sorting(
  config: DatasourceEntryConfiguration,
  data: EntryData,
  tags?: string[]
): string | null;

// convert data of certain entry into comparable format.
//  result might be number / string if conversion succeed, which will be consistently predictable from the
//  data type of the entry and the sorting method. If the conversion failed, null is returned
export function to_sorting(
  config: DatasourceEntryConfiguration,
  data: EntryData,
  tags?: string[]
): string | null {
  switch (config.type) {
    case "string":
      return to_sorting_string(config, data as StringEntryData);
    case "rating":
      return to_sorting_rating(config, data as RatingEntryData);
    case "tag":
      if (tags === undefined) {
        return null;
      }
      return to_sorting_tag(config, data as TagEntryData, tags);
  }
}
