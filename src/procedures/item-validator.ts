import { Sorting } from "@/definitions/sorting_types";
import type {
  EntriesConfiguration,
  InternalDataItem,
  InternalEntryData,
  InternalRatingEntryData,
  InternalTagEntryData,
  StringEntryData,
} from "@/types/datasource-entry";
import type { DatasourceEntryConfiguration, EntryType } from "@/types/datasource-entry-details";
import { ItemInvalidType, type ItemInvalidReason } from "@/types/invalid-items";
import { to_sorting } from "./sorting";

function entry_checker_common(
  config: DatasourceEntryConfiguration,
  data: InternalEntryData
): ItemInvalidReason | null {
  // @ts-ignore
  if (config.sorting_method !== Sorting.Disabled && to_sorting(config, data, []) === null) {
    return {
      type: ItemInvalidType.formatting,
      expected_format: config.sorting_method,
    };
  }

  return null;
}

function entry_checker_string(
  config: DatasourceEntryConfiguration,
  data_: InternalEntryData | undefined
): ItemInvalidReason | null {
  if (config.type !== "string") {
    return null; // never happens
  }
  const data = data_ as StringEntryData;
  if (data === undefined || data.value === "") {
    if (config.optional) {
      return null;
    }
    return { type: ItemInvalidType.missing, key: config.name };
  }
  return entry_checker_common(config, data);
}
function entry_checker_rating(
  config: DatasourceEntryConfiguration,
  data_: InternalEntryData | undefined
): ItemInvalidReason | null {
  if (config.type !== "rating") {
    return null; // never happens
  }
  const data = data_ as InternalRatingEntryData;
  if (data === undefined || data.score === 0) {
    if (config.optional) {
      return null;
    }
    return { type: ItemInvalidType.missing, key: config.name };
  }
  return entry_checker_common(config, data);
}
function entry_checker_tag(
  config: DatasourceEntryConfiguration,
  data_: InternalEntryData | undefined
): ItemInvalidReason | null {
  if (config.type !== "tag") {
    return null; // never happens
  }
  const data = data_ as InternalTagEntryData;
  if (data === undefined || data.tags.length === 0) {
    if (config.optional) {
      return null;
    }
    return { type: ItemInvalidType.missing, key: config.name };
  }
  if (config.exclusive && data.tags.length > 1) {
    return { type: ItemInvalidType.exclusive, key: config.name };
  }
  return entry_checker_common(config, data);
}

const checkers: Map<
  EntryType,
  (config: DatasourceEntryConfiguration, data_: InternalEntryData | undefined) => ItemInvalidReason | null
> = new Map([
  ["string", entry_checker_string],
  ["rating", entry_checker_rating],
  ["tag", entry_checker_tag],
]);
export function validate_internal_item(
  item: InternalDataItem,
  override_image: string,
  configuration: EntriesConfiguration
): ItemInvalidReason[] {
  const reasons: ItemInvalidReason[] = [];
  // check if image is included according to the configuration
  if (configuration.image_size !== undefined) {
    if (item.image === undefined && override_image === "") {
      reasons.push({ type: ItemInvalidType.missing });
    }
  }
  // check each entry
  configuration.entries.forEach((entry) => {
    const check_result = checkers.get(entry.type)!(entry, item.entries.get(entry.name));
    if (check_result !== null) {
      reasons.push(check_result);
    }
  });
  return reasons;
}
