import { Sorting } from "@/definitions/sorting_types";
import { i18n } from "@/locales";
import { useDatabaseStore } from "@/stores/database";
import type { DataItem } from "@/types/datasource-data";
import type {
  EntriesConfiguration,
  EntryData,
  RatingEntryData,
  StringEntryData,
  TagEntryData,
} from "@/types/datasource-entry";
import type {
  DatasourceEntryConfiguration,
  DatasourceEntryTagConfiguration,
  EntryType,
} from "@/types/datasource-entry-details";
import { ImageImageFormat, ThumbnailImageFormat } from "@/types/image-types";
import { load_image } from "./image-utils";
import { to_sorting } from "./sorting";

const { t } = i18n.global;

export interface LoadedImage {
  image: ImageBitmap;
  image_url: string;
  thumbnail: ImageBitmap;
  thumbnail_url: string;
}

// Since the item-validator APIs are designed for internal data items while we create data items directly,
//  we cannot utilize those APIs and have to do all validations by ourselves. Importing data from user
//  supplied text requires carefully validation, we may want to rebuild this later, but for now, be careful
//  to check if all required entries is included, all formatting requirements fulfilled and all entry type-
//  specified settings satisfied.
// The item-validator APIs are used to check the (internal) data item reactively while which is actively
//  modified. Converting it into actual DataItem before making the check can unify the data validation APIs,
//  but might introduce extra delay that can be unacceptable as a part of UI component.
// We may find a better solution later.

function string_loader(data: any, config_: DatasourceEntryConfiguration): EntryData {
  if (typeof data !== "string") {
    throw Error(t("message.error.expected_string"));
  }
  if (data.length === 0 && !config_.optional) {
    throw Error(t("message.error.missing_required_entry", [config_.name]));
  }
  const result: StringEntryData = { value: data };
  return result;
}
function tag_loader(data: any, config_: DatasourceEntryConfiguration) {
  const database = useDatabaseStore();
  if (!(data instanceof Array)) {
    throw Error(t("message.error.expected_array"));
  }
  if (data.some((value) => typeof value !== "string" || value.length === 0)) {
    throw Error(t("message.error.expected_string"));
  }
  const config = config_ as DatasourceEntryTagConfiguration;
  if (config.exclusive && data.length > 1) {
    throw Error(t("message.error.exclusive_tag", [config.name]));
  }
  if (!config.optional && data.length === 0) {
    throw Error(t("message.error.missing_required_entry", [config.name]));
  }
  const tags = database.prepare_tag_registration().register_tags(config_.name, data as string[]);
  const result: TagEntryData = { tags: tags.sort() };
  return result;
}
function rating_loader(data: any, config_: DatasourceEntryConfiguration) {
  if (typeof data !== "object" || data.score === undefined) {
    throw Error(t("message.error.invalid_rating_entry"));
  }
  if (!config_.optional && data.score === 0) {
    throw Error(t("message.error.missing_required_entry", [config_.name]));
  }
  const result: RatingEntryData = { score: data.score, comment: data.comment ? data.comment : undefined };
  return result;
}

const loaders: Map<EntryType, (data: any, config_: DatasourceEntryConfiguration) => EntryData> = new Map([
  ["string", string_loader],
  ["tag", tag_loader],
  ["rating", rating_loader],
]);

// load a dumped item from a string
//  this function construct an instance of DataItem from the data given as text string and load the image file
//   which is supplied as a Blob
//  On success, this function returns the DataItem constructed and the (optional) image loaded, which will be
//   undefined if image file is not supplied
//  On failure, this function throws error
//   Failure is triggered if the data text supplied is invalid, image is missing or cannot be decoded, or the
//    data text has missing entry that is not optional
//   Errors from entry loaders will not be caught by this function
export async function load_dumped_item(
  configuration: EntriesConfiguration,
  text: string,
  image?: Blob
): Promise<{ data: DataItem; images?: LoadedImage }> {
  const data = JSON.parse(text);
  if (typeof data !== "object") {
    throw Error(t("message.error.invalid_data_string"));
  }
  const result: { data: DataItem; images?: LoadedImage } = {
    data: {
      entries: configuration.entries.length > 0 ? new Map() : undefined,
    },
  };
  configuration.entries.forEach((entry_config) => {
    if (data[entry_config.name] === undefined) {
      if (!entry_config.optional) {
        throw Error(t("message.error.missing_required_entry", [entry_config.name]));
      }
      return;
    }
    const raw_value = data[entry_config.name];
    const value = loaders.get(entry_config.type)!(raw_value, entry_config);
    // check formatting
    if (entry_config.sorting_method !== Sorting.Disabled && to_sorting(entry_config, value, []) === null) {
      throw Error(t("message.error.invalid_formatting", [entry_config.name]));
    }
    result.data.entries!.set(entry_config.name, value);
  });
  if (configuration.image_size !== undefined) {
    if (image === undefined) {
      throw Error(t("message.error.image_not_found"));
    }
    const images = await load_image(image, configuration.image_size, ImageImageFormat, ThumbnailImageFormat);
    if (images === null) {
      throw Error(t("message.error.invalid_image"));
    }
    result.images = images;
  }
  return result;
}
