import { en } from "./dictionaries/en";
import { hu } from "./dictionaries/hu";
import { sk } from "./dictionaries/sk";
import { uk } from "./dictionaries/uk";
import type { Locale } from "./config";
import type { TranslationDictionary, TranslationKey } from "./types";

const dictionaries: Readonly<Record<Locale, TranslationDictionary>> = {
  uk,
  sk,
  en,
  hu,
};

export type TranslationParameters = Readonly<Record<string, string | number>>;

export function getDictionary(locale: Locale): TranslationDictionary {
  return dictionaries[locale];
}

export function interpolateTranslation(
  template: string,
  parameters: TranslationParameters,
): string {
  return template.replace(/\{([^{}]+)\}/g, (placeholder, parameterName) => {
    const value = parameters[parameterName];
    return value === undefined ? placeholder : String(value);
  });
}

export function t(
  locale: Locale,
  key: TranslationKey,
  parameters?: TranslationParameters,
): string {
  const value = dictionaries[locale][key];

  return parameters === undefined
    ? value
    : interpolateTranslation(value, parameters);
}

export const translate = t;
