import type { Sorting } from "@/definitions/sorting_types";

export enum ItemInvalidType {
  missing,
  formatting,
  duplicated_value,
  exclusive,
}
interface InvalidBase {
  key?: string; // the name of entry corresponding to this error, the image if undefined
}
export interface InvalidMissing extends InvalidBase {
  type: ItemInvalidType.missing;
}
export interface InvalidFormatting extends InvalidBase {
  type: ItemInvalidType.formatting;
  expected_format: Sorting;
}
export interface InvalidDuplicatedValue extends InvalidBase {
  type: ItemInvalidType.duplicated_value;
  value: string; // value that is duplicated
}
export interface InvalidExclusive extends InvalidBase {
  type: ItemInvalidType.exclusive;
}
export type ItemInvalidReason =
  | InvalidMissing
  | InvalidFormatting
  | InvalidDuplicatedValue
  | InvalidExclusive;

import { i18n } from "@/locales";
const { t } = i18n.global;
export function explain_invalid_reason(reason: ItemInvalidReason): string {
  switch (reason.type) {
    case ItemInvalidType.missing:
      return t("message.item_invalid_reason.missing_entry", [
        reason.key === undefined ? t("message.item_invalid_reason.image") : reason.key,
      ]);
    case ItemInvalidType.duplicated_value:
      return t("message.item_invalid_reason.duplicated_value", [reason.key!, reason.value]);
    case ItemInvalidType.exclusive:
      return t("message.item_invalid_reason.exclusive_tag", [reason.key!]);
    case ItemInvalidType.formatting:
      return t("message.item_invalid_reason.invalid_formatting", [
        reason.key!,
        t(`sorting.${reason.expected_format}.name`),
      ]);
    default:
      return "";
  }
}
