import type { uk } from "./dictionaries/uk";

export type TranslationKey = keyof typeof uk;
export type TranslationDictionary = Readonly<Record<TranslationKey, string>>;
