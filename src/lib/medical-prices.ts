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

export type MedicalServiceTranslation = Readonly<
  Record<LocalizedLocale, string>
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

/** Numeric IDs are the stable translation boundary for all rendered locales. */
export const MEDICAL_SERVICE_TRANSLATIONS: Readonly<
  Record<MedicalPriceId, MedicalServiceTranslation>
> = {
  1: {
    en: "Chief physician consultation",
    sk: "Konzultácia hlavnej lekárky",
    hu: "Főorvosi konzultáció",
  },
  2: {
    en: "Initial ophthalmologist consultation* + intraocular pressure measurement (age 40+)",
    sk: "Vstupná konzultácia oftalmológa* + meranie vnútroočného tlaku (od 40 rokov)",
    hu: "Első szemészeti konzultáció* + szemnyomásmérés (40 éves kortól)",
  },
  3: {
    en: "Initial ophthalmologist consultation",
    sk: "Vstupná konzultácia oftalmológa",
    hu: "Első szemészeti konzultáció",
  },
  4: {
    en: "Initial pediatric ophthalmologist consultation",
    sk: "Vstupná konzultácia detského oftalmológa",
    hu: "Első gyermek-szemészeti konzultáció",
  },
  5: {
    en: "Follow-up pediatric ophthalmologist consultation",
    sk: "Kontrolná konzultácia detského oftalmológa",
    hu: "Kontroll gyermek-szemészeti konzultáció",
  },
  6: {
    en: "Follow-up ophthalmologist consultation",
    sk: "Kontrolná konzultácia oftalmológa",
    hu: "Kontroll szemészeti konzultáció",
  },
  7: {
    en: "Autorefraction, both eyes",
    sk: "Autorefraktometria oboch očí",
    hu: "Autorefraktometria, mindkét szem",
  },
  8: {
    en: "Autokeratorefractometry, both eyes",
    sk: "Autokeratorefraktometria oboch očí",
    hu: "Autokeratorefraktometria, mindkét szem",
  },
  9: {
    en: "Visual acuity testing, both eyes",
    sk: "Vyšetrenie zrakovej ostrosti oboch očí",
    hu: "Látásélesség-vizsgálat, mindkét szem",
  },
  10: {
    en: "Maklakov tonometry, both eyes",
    sk: "Maklakovova tonometria oboch očí",
    hu: "Maklakov-tonometria, mindkét szem",
  },
  11: {
    en: "Biomicroscopy, both eyes",
    sk: "Biomikroskopia oboch očí",
    hu: "Biomikroszkópia, mindkét szem",
  },
  12: {
    en: "Biomicroscopy, one eye",
    sk: "Biomikroskopia jedného oka",
    hu: "Biomikroszkópia, egy szem",
  },
  13: {
    en: "Ophthalmoscopy with a VOLK-90D aspheric lens, one eye",
    sk: "Oftalmoskopia asférickou šošovkou VOLK-90D, jedno oko",
    hu: "Szemfenékvizsgálat aszférikus VOLK-90D lencsével, egy szem",
  },
  14: {
    en: "Ophthalmoscopy with a VOLK-90D aspheric lens, both eyes",
    sk: "Oftalmoskopia asférickou šošovkou VOLK-90D, obe oči",
    hu: "Szemfenékvizsgálat aszférikus VOLK-90D lencsével, mindkét szem",
  },
  15: {
    en: "Mirror ophthalmoscopy, both eyes",
    sk: "Zrkadlová oftalmoskopia oboch očí",
    hu: "Tükrös szemfenékvizsgálat, mindkét szem",
  },
  16: {
    en: "Direct ophthalmoscopy, both eyes",
    sk: "Priama oftalmoskopia oboch očí",
    hu: "Közvetlen szemfenékvizsgálat, mindkét szem",
  },
  17: {
    en: "Retinoscopy, both eyes",
    sk: "Retinoskopia oboch očí",
    hu: "Retinoszkópia, mindkét szem",
  },
  18: {
    en: "Retinoscopy, one eye",
    sk: "Retinoskopia jedného oka",
    hu: "Retinoszkópia, egy szem",
  },
  19: {
    en: "Transpalpebral tonometry, both eyes",
    sk: "Transpalpebrálna tonometria oboch očí",
    hu: "Transzpalpebrális tonometria, mindkét szem",
  },
  20: {
    en: "Spherical spectacle correction selection, both eyes",
    sk: "Výber sférickej okuliarovej korekcie pre obe oči",
    hu: "Szférikus szemüvegkorrekció kiválasztása, mindkét szem",
  },
  21: {
    en: "Sphero-cylindrical spectacle correction selection, both eyes",
    sk: "Výber sféro-cylindrickej okuliarovej korekcie pre obe oči",
    hu: "Szferocilindrikus szemüvegkorrekció kiválasztása, mindkét szem",
  },
  22: {
    en: "Contact lens fitting, both eyes",
    sk: "Výber kontaktných šošoviek pre obe oči",
    hu: "Kontaktlencse-illesztés, mindkét szem",
  },
  23: {
    en: "Training in soft contact lens handling (insertion/removal/care)",
    sk: "Nácvik manipulácie s mäkkými kontaktnými šošovkami (nasadenie/vybratie/starostlivosť)",
    hu: "Betanítás a lágy kontaktlencse használatára (felhelyezés/eltávolítás/ápolás)",
  },
  24: {
    en: "Removal of a foreign body from the superficial corneal and conjunctival layers, one eye",
    sk: "Odstránenie cudzieho telieska z povrchových vrstiev rohovky a spojovky, jedno oko",
    hu: "Idegentest eltávolítása a szaruhártya és a kötőhártya felszíni rétegeiből, egy szem",
  },
  25: {
    en: "Strabismus angle assessment using the Hirschberg method",
    sk: "Určenie uhla strabizmu Hirschbergovou metódou",
    hu: "A kancsalsági szög meghatározása Hirschberg-módszerrel",
  },
  26: {
    en: "Colour vision assessment using Rabkin polychromatic tables",
    sk: "Vyšetrenie farbocitu pomocou Rabkinových polychromatických tabuliek",
    hu: "Színlátásvizsgálat Rabkin-féle polikromatikus táblákkal",
  },
  27: {
    en: "Schirmer test",
    sk: "Schirmerov test",
    hu: "Schirmer-teszt",
  },
  28: {
    en: "Injection of a medicinal product into the chalazion area",
    sk: "Injekcia lieku do oblasti chalaziónu",
    hu: "Gyógyszer injekciója a chalazion területére",
  },
  29: {
    en: "Eyelid massage, both eyes",
    sk: "Masáž viečok oboch očí",
    hu: "Szemhéjmasszázs, mindkét szem",
  },
  30: {
    en: "Lacrimal duct probing, one eye",
    sk: "Sondáž slzných kanálikov, jedno oko",
    hu: "Könnycsatorna-szondázás, egy szem",
  },
  31: {
    en: "Lacrimal duct probing, both eyes",
    sk: "Sondáž slzných kanálikov, obe oči",
    hu: "Könnycsatorna-szondázás, mindkét szem",
  },
  32: {
    en: "Canalicular and lacrimal-nasal drainage tests",
    sk: "Kanáliková a slzno-nosová skúška",
    hu: "Könnycsatorna- és könny-orrjárati próba",
  },
  33: {
    en: "Dry eye syndrome tests",
    sk: "Testy na syndróm suchého oka",
    hu: "Szárazszem-szindróma vizsgálatok",
  },
  38: {
    en: "Ocular bacterial culture with antibiogram, one eye",
    sk: "Bakteriálna kultivácia z oka s antibiogramom, jedno oko",
    hu: "Szemváladék bakteriológiai tenyésztése antibiotikum-érzékenységi vizsgálattal, egy szem",
  },
  39: {
    en: "Demodex microscopy (detection of Demodex skin mites)",
    sk: "Mikroskopia na Demodex (detekcia kožného roztoča rodu Demodex)",
    hu: "Demodex-mikroszkópia (a Demodex nemzetségbe tartozó bőratka kimutatása)",
  },
  40: {
    en: "Specimen collection for bacterial culture in transport medium",
    sk: "Odber materiálu na bakteriologické vyšetrenie do transportného média",
    hu: "Mintavétel bakteriológiai tenyésztéshez transzportközegbe",
  },
};

export const MEDICAL_SERVICE_NOTE_TRANSLATIONS: Readonly<
  Partial<
    Record<MedicalPriceId, Readonly<Record<LocalizedLocale, string>>>
  >
> = {
  2: {
    en: "*promotional comprehensive (extended) examination",
    sk: "*akciové komplexné (rozšírené) vyšetrenie",
    hu: "*akciós komplex (részletes) vizsgálat",
  },
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

  return MEDICAL_SERVICE_TRANSLATIONS[item.id][locale];
}

export function getMedicalServiceDisplayNote(
  item: CanonicalMedicalPriceItem,
  locale: Locale,
): string | undefined {
  if (item.noteUk === undefined || locale === "uk") {
    return item.noteUk;
  }

  return MEDICAL_SERVICE_NOTE_TRANSLATIONS[item.id]?.[locale];
}

export function usesOfficialUkrainianNameFallback(_locale: Locale): boolean {
  return false;
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
