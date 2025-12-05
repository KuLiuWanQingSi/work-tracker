// i18n handling with language switching support
import { nextTick } from "vue";
import { createI18n, type I18n } from "vue-i18n";

export const SUPPORT_LOCALES = new Map([
  ["en", "English"],
  ["zhHans", "简体中文"],
]);

function _get_user_locale(): string {
  const PredefinedMapping: Map<string, string> = new Map([["zh-cn", "zhHans"]]);

  const raw_locale = navigator.language.toLowerCase();
  return PredefinedMapping.get(raw_locale) ?? "en";
}

// build i18n instance
async function setupI18n(): Promise<I18n<any, {}, {}, string, false>> {
  const locale = _get_user_locale();
  const i18n = createI18n({ locale, legacy: false });
  // the locale specified to createI18n will be marked as available anyway though it is not actually loaded
  //  we need to skip the checking so that we can load it
  await loadLocaleMessages(i18n, locale);
  await setI18nLanguage(i18n, locale);
  return i18n;
}

export async function setI18nLanguage(i18n: I18n<any, {}, {}, string, false>, locale: string) {
  if (!i18n.global.availableLocales.includes(locale)) {
    // the translations must be loaded first
    await loadLocaleMessages(i18n, locale);
  }
  i18n.global.locale.value = locale;
}

export async function loadLocaleMessages(i18n: I18n<any, {}, {}, string, false>, locale: string) {
  // load locale messages with dynamic import
  const language_package = await import(`./translations/${locale}.ts`);

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, language_package.message);

  return nextTick();
}

export const i18n = await setupI18n();
