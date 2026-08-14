import {
  MEDICAL_PRICE_ITEMS,
  MEDICAL_PRICE_LIST_META,
} from "../src/data/medical-prices.ts";
import {
  medicalPriceItemSchema,
  medicalPriceListMetaSchema,
} from "../src/schemas/medical-price.ts";
import {
  MEDICAL_SERVICE_NOTE_TRANSLATIONS,
  MEDICAL_SERVICE_TRANSLATIONS,
} from "../src/lib/medical-prices.ts";
import { en } from "../src/lib/i18n/dictionaries/en.ts";
import { hu } from "../src/lib/i18n/dictionaries/hu.ts";
import { sk } from "../src/lib/i18n/dictionaries/sk.ts";
import { uk } from "../src/lib/i18n/dictionaries/uk.ts";
import type {
  MedicalUiCategory,
  OfficialPriceSection,
} from "../src/schemas/medical-price.ts";

const EXPECTED_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 38, 39, 40,
] as const;
const REMOVED_IDS = [34, 35, 36, 37] as const;
const EXPECTED_ITEM_COUNT = EXPECTED_IDS.length;
const LOCALIZED_LOCALES = ["en", "sk", "hu"] as const;
const DICTIONARIES = { uk, en, sk, hu } as const;
const REMOVED_TRANSLATION_KEYS = [
  "services.groupTherapy",
  "services.itemParabulbar",
  "services.itemSubconjunctival",
] as const;
const ACTIVE_GROUP_TRANSLATION_KEYS = [
  "services.groupConsultations",
  "services.groupDiagnostics",
  "services.groupOptics",
  "services.groupProcedures",
  "services.groupLaboratory",
] as const;
const REMOVED_MEDICAL_TEXT_PATTERN =
  /(?:parabul|subconj|парабул|субкон|космет|cosmet|kozmet|ін[’'ʼ]?єкції та терап|injections?\s*(?:&|and)\s*therapy|injekcie a terapia|injekciók és terápia)/iu;

const EXPECTED_PRICES_UAH: readonly number[] = [
  800, 700, 700, 700, 600, 600, 200, 200, 200, 300,
  400, 300, 200, 300, 150, 250, 300, 200, 50, 300,
  350, 300, 400, 600, 200, 300, 200, 1200, 400, 400,
  700, 300, 200, 600, 300, 100,
];

const EXPECTED_UI_CATEGORIES: readonly MedicalUiCategory[] = [
  "consultations",
  "consultations",
  "consultations",
  "consultations",
  "consultations",
  "consultations",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "optical-selection",
  "optical-selection",
  "optical-selection",
  "optical-selection",
  "procedures",
  "diagnostics",
  "diagnostics",
  "diagnostics",
  "procedures",
  "procedures",
  "procedures",
  "procedures",
  "diagnostics",
  "diagnostics",
  "laboratory",
  "laboratory",
  "laboratory",
];

const EXPECTED_OFFICIAL_NAMES_UK: readonly string[] = [
  "Консультація головного лікаря",
  "Первинна консультація офтальмолога*+ ВОТ(з40 р.)",
  "Первинна консультація офтальмолога",
  "Первинна консультація дитячого офтальмолога",
  "Повторна консультація дитячого офтальмолога",
  "Повторна консультація офтальмолога",
  "Авторефрактометрія 2 ока",
  "Автокераторефрактометрія 2 ока",
  "Візометрія 2 ока",
  "Тонометрія за Маклаковим  2 ока",
  "Біомікроскопія 2 ока",
  "Біомікроскопія 1 око",
  "Офтальмоскопія (асферичною лінзою) VOLK-90D 1 око",
  "Офтальмоскопія (асферичною лінзою) VOLK-90D 2 ока",
  "Офтальмоскопія (дзеркальна) 2 ока",
  "Офтальмоскопія (пряма) 2 ока",
  "Ретиноскопія 2 ока",
  "Ретиноскопія 1 око",
  "Транспальпебральна тонометрія 2 ока",
  "Підбір окулярів (сферичних) 2 ока",
  "Підбір окулярів (сферо-циліндричних) 2 ока",
  "Підбір контактних лінз 2 ока",
  "Навчання маніпуляціям з м’якими контактними лінзами (одягання/знімання/догляд)",
  "Видалення стороннього тіла з поверхневих шарів рогівки та кон'юктиви 1 око",
  "Визначення кута косоокості методом Гіршберга",
  "Визначення порушення кольоровідчуття (поліхроматичними таблицями Рабкіна)",
  "Тест (проба) Ширмера",
  "Ін'єкція в ділянку халязіона лікарського засобу",
  "Масаж повік обох очей",
  "Зондування слізних каналів (1 око)",
  "Зондування слізних каналів (2 ока)",
  "Проведення канальцевої та сльозоносової проб",
  'Тести на синдром"сухого ока"',
  "Бакпосів з ока+антибіотикограма (1 око)",
  "Демодекс (Мікроскопія на виявлення шкірного кліща роду Demodex)",
  "Забір матеріалу на БАК(у транс.середовище)",
];

const EXPECTED_NOTE_UK_BY_ID = new Map<number, string>([
  [2, "*акційний комплексний (поглиблений) огляд"],
]);

const KEY_PRICE_ASSERTIONS: ReadonlyArray<{
  id: number;
  priceUah: number;
}> = [
  { id: 1, priceUah: 800 },
  { id: 2, priceUah: 700 },
  { id: 3, priceUah: 700 },
  { id: 4, priceUah: 700 },
  { id: 5, priceUah: 600 },
  { id: 6, priceUah: 600 },
  { id: 28, priceUah: 1200 },
  { id: 40, priceUah: 100 },
];

const validationErrors: string[] = [];
const metaResult = medicalPriceListMetaSchema.safeParse(MEDICAL_PRICE_LIST_META);
const itemsResult = medicalPriceItemSchema.array().safeParse(MEDICAL_PRICE_ITEMS);

if (!metaResult.success) {
  validationErrors.push(`Metadata failed Zod validation: ${metaResult.error.message}`);
}

if (!itemsResult.success) {
  validationErrors.push(`Items failed Zod validation: ${itemsResult.error.message}`);
} else {
  const items = itemsResult.data;
  const ids = items.map(({ id }) => id);
  const uniqueIds = new Set(ids);
  const itemById = new Map(items.map((item) => [item.id, item]));

  if (items.length !== EXPECTED_ITEM_COUNT) {
    validationErrors.push(
      `Expected ${EXPECTED_ITEM_COUNT} items, received ${items.length}.`,
    );
  }

  if (uniqueIds.size !== ids.length) {
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    validationErrors.push(
      `Duplicate IDs found: ${[...new Set(duplicateIds)].join(", ")}.`,
    );
  }

  for (const expectedId of EXPECTED_IDS) {
    if (!uniqueIds.has(expectedId)) {
      validationErrors.push(`Missing ID ${expectedId}.`);
    }
  }

  for (const removedId of REMOVED_IDS) {
    if (uniqueIds.has(removedId)) {
      validationErrors.push(`Removed ID ${removedId} must not be present.`);
    }
  }

  for (const [zeroBasedIndex, expectedPriceUah] of EXPECTED_PRICES_UAH.entries()) {
    const id = EXPECTED_IDS[zeroBasedIndex];
    if (id === undefined) {
      validationErrors.push(
        `Canonical ID is missing at index ${zeroBasedIndex}.`,
      );
      continue;
    }
    const item = itemById.get(id);
    const expectedUiCategory = EXPECTED_UI_CATEGORIES[zeroBasedIndex];
    const expectedOfficialNameUk = EXPECTED_OFFICIAL_NAMES_UK[zeroBasedIndex];
    const expectedOfficialSection: OfficialPriceSection =
      id <= 33 ? "ophthalmology" : "other-medical-services";
    const expectedNoteUk = EXPECTED_NOTE_UK_BY_ID.get(id);

    if (!item) {
      continue;
    }

    if (expectedUiCategory === undefined) {
      validationErrors.push(`Canonical UI category is missing for ID ${id}.`);
    } else if (item.uiCategory !== expectedUiCategory) {
      validationErrors.push(
        `ID ${id} uiCategory mismatch: expected ${JSON.stringify(expectedUiCategory)}, received ${JSON.stringify(item.uiCategory)}.`,
      );
    }

    if (expectedOfficialNameUk === undefined) {
      validationErrors.push(`Canonical officialNameUk is missing for ID ${id}.`);
    } else if (item.officialNameUk !== expectedOfficialNameUk) {
      validationErrors.push(
        `ID ${id} officialNameUk mismatch: expected ${JSON.stringify(expectedOfficialNameUk)}, received ${JSON.stringify(item.officialNameUk)}.`,
      );
    }

    if (item.officialSection !== expectedOfficialSection) {
      validationErrors.push(
        `ID ${id} officialSection mismatch: expected ${JSON.stringify(expectedOfficialSection)}, received ${JSON.stringify(item.officialSection)}.`,
      );
    }

    if (item.priceUah !== expectedPriceUah) {
      validationErrors.push(
        `ID ${id} priceUah mismatch: expected ${expectedPriceUah}, received ${item.priceUah}.`,
      );
    }

    if (item.noteUk !== expectedNoteUk) {
      validationErrors.push(
        `ID ${id} noteUk mismatch: expected ${JSON.stringify(expectedNoteUk)}, received ${JSON.stringify(item.noteUk)}.`,
      );
    }
  }

  for (const expected of KEY_PRICE_ASSERTIONS) {
    const item = itemById.get(expected.id);

    if (!item) {
      validationErrors.push(`Key price assertion could not find ID ${expected.id}.`);
    } else if (item.priceUah !== expected.priceUah) {
      validationErrors.push(
        `Key price assertion failed for ID ${expected.id}: expected ${expected.priceUah} UAH, received ${item.priceUah} UAH.`,
      );
    }
  }

  const canonicalIdSignature = EXPECTED_IDS.join(",");
  const localeIdSignatures = {
    uk: items.map(({ id }) => id).join(","),
    en: items.map(({ id }) => id).join(","),
    sk: items.map(({ id }) => id).join(","),
    hu: items.map(({ id }) => id).join(","),
  } as const;

  for (const [locale, signature] of Object.entries(localeIdSignatures)) {
    if (signature !== canonicalIdSignature) {
      validationErrors.push(
        `${locale.toUpperCase()} medical-service ID set differs from the canonical 36-ID set.`,
      );
    }
  }

  for (const item of items) {
    if (REMOVED_MEDICAL_TEXT_PATTERN.test(item.officialNameUk) && item.id !== 28) {
      validationErrors.push(
        `Canonical medical item ${item.id} contains removed injection/cosmetology wording: ${JSON.stringify(item.officialNameUk)}.`,
      );
    }

    const translations = MEDICAL_SERVICE_TRANSLATIONS[item.id as keyof typeof MEDICAL_SERVICE_TRANSLATIONS];
    for (const locale of LOCALIZED_LOCALES) {
      const translatedName = translations[locale];
      if (translatedName.trim().length === 0) {
        validationErrors.push(
          `Missing ${locale.toUpperCase()} medical translation for ID ${item.id}.`,
        );
      }
      if (
        REMOVED_MEDICAL_TEXT_PATTERN.test(translatedName) &&
        item.id !== 28
      ) {
        validationErrors.push(
          `${locale.toUpperCase()} medical translation for ID ${item.id} contains removed injection/cosmetology wording: ${JSON.stringify(translatedName)}.`,
        );
      }
    }

    if (item.noteUk !== undefined) {
      const noteTranslations = (MEDICAL_SERVICE_NOTE_TRANSLATIONS as Record<number, any>)[item.id];
      for (const locale of LOCALIZED_LOCALES) {
        const translatedNote = noteTranslations?.[locale];
        if (translatedNote !== undefined && translatedNote.trim().length > 0) {
          continue;
        }
        validationErrors.push(
          `Missing ${locale.toUpperCase()} note translation for medical ID ${item.id}.`,
        );
      }
    }
  }
}

const canonicalDictionaryKeys = Object.keys(DICTIONARIES.uk).sort();
for (const [locale, dictionary] of Object.entries(DICTIONARIES)) {
  const dictionaryKeys = Object.keys(dictionary).sort();

  if (
    dictionaryKeys.length !== canonicalDictionaryKeys.length ||
    dictionaryKeys.some(
      (translationKey, index) =>
        translationKey !== canonicalDictionaryKeys[index],
    )
  ) {
    validationErrors.push(
      `${locale.toUpperCase()} dictionary keys are not in parity with the Ukrainian dictionary.`,
    );
  }

  for (const removedKey of REMOVED_TRANSLATION_KEYS) {
    if (Object.prototype.hasOwnProperty.call(dictionary, removedKey)) {
      validationErrors.push(
        `${locale.toUpperCase()} dictionary still contains dead key ${removedKey}.`,
      );
    }
  }

  const groupKeys = dictionaryKeys.filter((key) =>
    key.startsWith("services.group"),
  );
  const expectedGroupKeys = [...ACTIVE_GROUP_TRANSLATION_KEYS].sort();
  if (
    groupKeys.length !== expectedGroupKeys.length ||
    groupKeys.some((key, index) => key !== expectedGroupKeys[index])
  ) {
    validationErrors.push(
      `${locale.toUpperCase()} dictionary contains a missing or orphaned medical group key: ${groupKeys.join(", ")}.`,
    );
  }

  for (const [translationKey, value] of Object.entries(dictionary)) {
    if (REMOVED_MEDICAL_TEXT_PATTERN.test(value)) {
      validationErrors.push(
        `${locale.toUpperCase()} dictionary key ${translationKey} contains removed injection/cosmetology wording.`,
      );
    }
  }
}

if (EXPECTED_PRICES_UAH.length !== EXPECTED_ITEM_COUNT) {
  validationErrors.push(
    `Expected-price table must contain ${EXPECTED_ITEM_COUNT} values, received ${EXPECTED_PRICES_UAH.length}.`,
  );
}

if (EXPECTED_UI_CATEGORIES.length !== EXPECTED_ITEM_COUNT) {
  validationErrors.push(
    `Canonical UI-category table must contain ${EXPECTED_ITEM_COUNT} values, received ${EXPECTED_UI_CATEGORIES.length}.`,
  );
}

if (EXPECTED_OFFICIAL_NAMES_UK.length !== EXPECTED_ITEM_COUNT) {
  validationErrors.push(
    `Canonical official-name table must contain ${EXPECTED_ITEM_COUNT} values, received ${EXPECTED_OFFICIAL_NAMES_UK.length}.`,
  );
}

if (validationErrors.length > 0) {
  console.error("Medical price validation failed:");
  for (const validationError of validationErrors) {
    console.error(`- ${validationError}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Medical price validation passed: UK/SK/EN/HU each resolve the same ${EXPECTED_ITEM_COUNT} canonical IDs; IDs 34–37 and their dead translation keys are absent; IDs 38–40 preserve their original numbering; all localized names and notes are present.`,
  );
}
