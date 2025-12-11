import type { EntriesConfiguration } from "@/types/datasource-entry";
import { i18n } from "@/locales";
import { RatingMetaConfiguration } from "@/types/datasource-entry-details";
const { t } = i18n.global;

// check entry configuration acquired from largely trustable environment (from the configuration page)
//  this check does not include most type checking: the input is supposed to be have proper shape, just some
//  invalid content might be included
export function get_entry_configuration_invalid_reasons_trusted(
  configuration: EntriesConfiguration,
): string[] {
  const reasons: string[] = [];
  if (configuration.image_size !== undefined) {
    // currently, there is only two reason that the image configuration can be invalid:
    // 1. the height or width of the image is not positive
    if (configuration.image_size.height <= 0 || configuration.image_size.width <= 0) {
      reasons.push(t("datasource_creation.error.image_size_not_positive"));
    }
    // 2. the height or width of the image is not an integer
    if (
      !Number.isInteger(configuration.image_size.height) ||
      !Number.isInteger(configuration.image_size.width)
    ) {
      reasons.push(t("datasource_creation.error.image_size_not_integer"));
    }
  }
  const used_names = new Set<string>();
  const recorded_duplication = new Set<string>();
  for (const [index, entry] of configuration.entries.entries()) {
    // currently, one entry can be invalid for following reasons:
    if (entry.name.length === 0) {
      // 1. the name is empty (empty string or contains only spaces)
      reasons.push(t("datasource_creation.error.entry_name_is_empty", { index: index + 1 }));
    } else if (!recorded_duplication.has(entry.name)) {
      // do not report multiple empty names as duplication
      if (used_names.has(entry.name)) {
        // 2. the name is duplicated
        reasons.push(t("datasource_creation.error.entry_name_is_duplicated", { name: entry.name }));
        recorded_duplication.add(entry.name);
      } else {
        // it is not empty and not duplicated
        used_names.add(entry.name);
      }
    }

    if (entry.type === "rating") {
      if (
        !Number.isInteger(entry.maximum_score) ||
        entry.maximum_score < RatingMetaConfiguration.minimum_score ||
        entry.maximum_score > RatingMetaConfiguration.maximum_score
      ) {
        // 3. if it has rating as its type and its max score is invalid
        reasons.push(
          t("datasource_creation.error.bad_rating_max_score", { name: entry.name, index: index + 1 }),
        );
      } else if (entry.hints !== null && entry.hints.length !== entry.maximum_score) {
        // 4. or if the length of array mismatches
        reasons.push(
          t("datasource_creation.error.rating_hint_mismatch", {
            score: entry.maximum_score,
            hint: entry.hints.length,
          }),
        );
      }
    }
  }
  // finally (or firstly?), having no entries and no image is an error
  if (configuration.image_size === undefined && configuration.entries.length === 0) {
    reasons.push(t("datasource_creation.error.empty_database"));
  }
  return reasons;
}

// helper functions

// check if name on the object exists and is a simple value: not getter/setter
function is_simple_field(object: any, name: string): boolean {
  const descriptors = Object.getOwnPropertyDescriptor(object, name);
  return descriptors !== undefined && descriptors.value !== undefined;
}

// common basic check for field in an object:
// 1. the field must exist
// 2. the field must not be implemented with getter
// 3. the field must match the type
// note that at most one error might be detected
function basic_check(object: any, name: string, type: string, prefix: string): string | undefined {
  if (object[name] === undefined) {
    return `missing ${prefix}.${name}`;
  }
  if (!is_simple_field(object, name)) {
    return `${prefix}.${name} is implemented by getter`;
  }
  if (typeof object[name] !== type) {
    return `${prefix}.${name} is not a ${type} as expected`;
  }
  return undefined;
}

// check an entry setting
function check_entry_setting(config: any): string[] {
  if (config === null) {
    return ["entry is null"];
  }
  if (typeof config !== "object") {
    return ["entry is not an object"];
  }
  if (Object.getPrototypeOf(config) !== Object.prototype) {
    return ["entry is not an plain object: nothing special, just { ... }"];
  }

  const reasons: string[] = [];
  for (const { name, type } of [
    { name: "name", type: "string" },
    { name: "sorting_method", type: "string" },
    { name: "optional", type: "boolean" },
  ]) {
    const result = basic_check(config, name, type, "");
    if (result !== undefined) {
      reasons.push(result);
    }
  }
  {
    const result = basic_check(config, "type", "string", "");
    if (result === undefined) {
      if (!["string", "tag", "rating"].includes(config.type)) {
        reasons.push(`unsupported type ${config.type}`);
        return reasons; // further check will be impossible without a valid type
      }
    } else {
      reasons.push(result);
      return reasons; // further check will be impossible without a valid type
    }
  }
  // check inner configurations (type-specific)
  switch (config.type) {
    case "string": {
      const result = basic_check(config, "unique", "boolean", "");
      if (result !== undefined) {
        reasons.push(result);
      }
      break;
    }
    case "tag": {
      const result = basic_check(config, "exclusive", "boolean", "");
      if (result !== undefined) {
        reasons.push(result);
      }
      break;
    }
    case "rating": {
      {
        const result = basic_check(config, "maximum_score", "number", "");
        if (result !== undefined) {
          reasons.push(result);
        }
      }
      {
        // null is an object
        const result = basic_check(config, "hints", "object", "");
        if (result === undefined) {
          if (config.hints !== null) {
            if (Array.isArray(config.hints)) {
              for (const [index, element] of config.hints.entries()) {
                if (element === undefined) {
                  reasons.push(`.hints.[${index}] is an empty slot`);
                } else {
                  const type = typeof element;
                  if (type !== "string") {
                    reasons.push(`.hints.[${index}] is not a string as expected but a ${type}`);
                  }
                }
              }
            } else {
              reasons.push(".hints is not null but not an instance of Array");
            }
          }
        } else {
          reasons.push(result);
        }
      }
      break;
    }
    default: {
      // no default: all possibilities listed
      break;
    }
  }
  return reasons;
}

// full entry configuration checker
//  this will first check if the input looks like an entry configuration. If it does not, report everything
//  that disappoints this function back to the caller. Otherwise, forward the input to the trusted checker.
//  NOTE that errors reported by this function are NOT translated by design: the entry configuration should
//   always be valid since all you need them is exporting the configuration from one existing database and
//   then load it to create another database, unless you have made some changes to the exported JSON file.
//   This is not recommended if you cannot read the errors reported here.
export function get_entry_configuration_invalid_reasons(configuration: any): string[] {
  const reasons: string[] = [];
  // 1. the configuration must be an plain object of nothing special
  if (configuration === null) {
    return ["configuration is null"];
  }
  if (typeof configuration !== "object") {
    return ["configuration is not an object"];
  }
  if (Object.getPrototypeOf(configuration) !== Object.prototype) {
    return ["configuration is not an plain object: nothing special, just { ... }"];
  }

  // 2. check top-level key: entries
  if (configuration.entries === undefined) {
    reasons.push(".entries is missing");
  } else if (is_simple_field(configuration, "entries")) {
    if (Array.isArray(configuration.entries)) {
      // this key seems ok, check each element in the value
      for (const [index, element] of configuration.entries.entries()) {
        const result = check_entry_setting(element).map(item => `.entries.[${index}]: ${item}`);
        reasons.push(...result);
      }
    } else {
      reasons.push(".entries is not an array");
    }
  } else {
    reasons.push(".entries is implemented by getter");
  }

  // 3. check top-level key: image_size
  //  it is ok for it to be undefined
  if (configuration.image_size !== undefined) {
    if (is_simple_field(configuration, "image_size")) {
      // this key seems ok, check each element in the value
      for (const key of ["width", "height"]) {
        const result = basic_check(configuration.image_size, key, "number", ".image_size");
        if (result !== undefined) {
          reasons.push(result);
        }
      }
    } else {
      reasons.push(".image_size is implemented by getter");
    }
  }

  // summarize
  if (reasons.length > 0) {
    return reasons;
  }
  return get_entry_configuration_invalid_reasons_trusted(configuration);
}
