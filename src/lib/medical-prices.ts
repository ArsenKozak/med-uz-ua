import {
  MEDICAL_PRICE_LIST_META,
  type CanonicalMedicalPriceItem,
  type MedicalPriceId,
} from "../data/medical-prices";
import type { MedicalUiCategory } from "../schemas/medical-price";
import { type Locale, type LocalizedLocale, type TranslationKey } from "./i18n";

export interface MedicalPriceGroup {
  readonly category: MedicalUiCategory;
  readonly titleKey: TranslationKey;
  readonly items: readonly CanonicalMedicalPriceItem[];
}

interface MedicalPriceGroupDefinition {
  readonly category: MedicalUiCategory;
  readonly titleKey: TranslationKey;
}

type MedicalServiceTranslation = Readonly<
  Partial<Record<LocalizedLocale, string>>
>;

const medicalPriceGroupDefinitions = [
  {
    category: "consultations",
    titleKey: "services.groupConsultations",
  },
  {
    category: "diagnostics",
    titleKey: "services.groupDiagnostics",
  },
  {
    category: "optical-selection",
    titleKey: "services.groupOptics",
  },
  {
    category: "procedures",
    titleKey: "services.groupProcedures",
  },
  {
    category: "laboratory",
    titleKey: "services.groupLaboratory",
  },
] as const satisfies readonly MedicalPriceGroupDefinition[];

/**
 * Numeric IDs are the translation boundary. Empty entries explicitly retain the
 * official Ukrainian wording until the clinic approves a localized medical label.
 */
export const MEDICAL_SERVICE_TRANSLATIONS: Readonly<
  Record<MedicalPriceId, MedicalServiceTranslation>
> = {
  1: {},
  2: {},
  3: {},
  4: {},
  5: {},
  6: {},
  7: {},
  8: {},
  9: {},
  10: {},
  11: {},
  12: {},
  13: {},
  14: {},
  15: {},
  16: {},
  17: {},
  18: {},
  19: {},
  20: {},
  21: {},
  22: {},
  23: {},
  24: {},
  25: {},
  26: {},
  27: {},
  28: {},
  29: {},
  30: {},
  31: {},
  32: {},
  33: {},
  38: {},
  39: {},
  40: {},
};

const localeTags: Readonly<Record<Locale, string>> = {
  uk: "uk-UA",
  sk: "sk-SK",
  en: "en-GB",
  hu: "hu-HU",
};

export function createMedicalPriceGroups(
  items: readonly CanonicalMedicalPriceItem[],
): readonly MedicalPriceGroup[] {
  return medicalPriceGroupDefinitions.map(({ category, titleKey }) => ({
    category,
    titleKey,
    items: items.filter((item) => item.uiCategory === category),
  }));
}

export function getMedicalServiceDisplayName(
  item: CanonicalMedicalPriceItem,
  locale: Locale,
): string {
  if (locale === "uk") {
    return item.officialNameUk;
  }

  return MEDICAL_SERVICE_TRANSLATIONS[item.id][locale] ?? item.officialNameUk;
}

export function usesOfficialUkrainianNameFallback(locale: Locale): boolean {
  return locale !== "uk";
}

export function formatMedicalPrice(priceUah: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTags[locale], {
    style: "currency",
    currency: MEDICAL_PRICE_LIST_META.currency,
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceUah);
}

export function formatMedicalPriceApprovalDate(locale: Locale): string {
  const approvalDate = new Date(
    `${MEDICAL_PRICE_LIST_META.approvedOn}T00:00:00.000Z`,
  );

  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(approvalDate);
}
