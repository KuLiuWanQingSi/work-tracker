import type { NoticePoster } from "@/types/injections";
import type { Result } from "@/types/result";
import { i18n } from "@/locales";

export * from "./utilities-pure";

const { t } = i18n.global;

// report the failure if the future returned an error
//  this function can be but is not written as an async function since current code is cleaner
export function error_reporter(
  future: Promise<void>,
  description: string,
  display_notice: NoticePoster,
): Promise<void> {
  return future.catch(error => {
    display_notice("error", t("message.error.failure_report", { task: description }), String(error));
  });
}

// error reporter that works with Result<T>
export async function result_error_reporter(
  future: Promise<Result<void>>,
  description: string,
  display_notice: NoticePoster,
): Promise<void> {
  try {
    const result = await future;
    result.map_error(failure => {
      display_notice("error", t("message.error.failure_report", { task: description }), String(failure));
      return undefined;
    });
  } catch (error) {
    display_notice("error", t("message.error.fallback_failure_report", { task: description }), String(error));
  }
}
