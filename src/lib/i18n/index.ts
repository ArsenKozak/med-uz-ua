export {
  DEFAULT_LOCALE,
  defaultLocale,
  isLocale,
  isLocalizedLocale,
  LOCALES,
  localeLabels,
  localeShortLabels,
  LOCALIZED_LOCALES,
  locales,
  localizedLocales,
  supportedLocales,
  type Locale,
  type LocalizedLocale,
} from "./config";
export {
  getLocalePath,
  localeFromPath,
  localizePath,
  stripLocalePrefix,
} from "./routes";
export {
  getDictionary,
  interpolateTranslation,
  t,
  translate,
  type TranslationParameters,
} from "./translate";
export type { TranslationDictionary, TranslationKey } from "./types";
