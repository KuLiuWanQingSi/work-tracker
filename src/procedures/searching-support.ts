import type { EntryData, RatingEntryData, StringEntryData, TagEntryData } from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration, EntryType } from "@/types/datasource-entry-details";
import { useDatabaseStore } from "@/stores/database";

function string_matcher(
  entry: EntryData,
  config: DatasourceEntryConfiguration,
  value: string,
  options?: { exact?: boolean },
): boolean {
  const data = entry as StringEntryData;
  return options?.exact ? data.value === value : data.value.includes(value);
}
function tag_matcher(
  entry: EntryData,
  config: DatasourceEntryConfiguration,
  value: string,
  options?: { exact?: boolean },
): boolean {
  const database = useDatabaseStore();
  const data = entry as TagEntryData;
  const tag_map = database.tags.get(config.name)!;
  const tag_as_string = data.tags.map(index => tag_map[index]!);
  return tag_as_string.some(tag => (options?.exact ? tag === value : tag.includes(value)));
}
function rating_matcher(
  entry: EntryData,
  config: DatasourceEntryConfiguration,
  value: string,
  options?: { exact?: boolean },
): boolean {
  const data = entry as RatingEntryData;
  if (data.comment === undefined) {
    return false;
  }
  return options?.exact ? data.comment === value : data.comment.includes(value);
}

const matchers: Map<
  EntryType,
  (
    entry: EntryData,
    config: DatasourceEntryConfiguration,
    value: string,
    options?: { exact?: boolean },
  ) => boolean
> = new Map([
  ["string", string_matcher],
  ["tag", tag_matcher],
  ["rating", rating_matcher],
]);

export function entry_matcher(
  entry: EntryData,
  config: DatasourceEntryConfiguration,
  value: string,
  options?: { exact?: boolean },
) {
  return matchers.get(config.type)!(entry, config, value, options);
}
