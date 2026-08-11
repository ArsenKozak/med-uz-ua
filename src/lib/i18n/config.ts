export const locales = ["uk", "sk", "en", "hu"] as const;
export const localizedLocales = ["sk", "en", "hu"] as const;

export type Locale = (typeof locales)[number];
export type LocalizedLocale = (typeof localizedLocales)[number];

export const defaultLocale: Locale = "uk";
export const supportedLocales = locales;

export const LOCALES = locales;
export const LOCALIZED_LOCALES = localizedLocales;
export const DEFAULT_LOCALE = defaultLocale;

export const localeLabels: Readonly<Record<Locale, string>> = {
  uk: "Українська",
  sk: "Slovenčina",
  en: "English",
  hu: "Magyar",
};

export const localeShortLabels: Readonly<Record<Locale, string>> = {
  uk: "UK",
  sk: "SK",
  en: "EN",
  hu: "HU",
};

export function isLocale(value: unknown): value is Locale {
  return value === "uk" || value === "sk" || value === "en" || value === "hu";
}

export function isLocalizedLocale(value: unknown): value is LocalizedLocale {
  return value === "sk" || value === "en" || value === "hu";
}
