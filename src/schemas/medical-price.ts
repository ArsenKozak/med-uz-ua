import { z } from "zod";

export const officialPriceSectionSchema = z.enum([
  "ophthalmology",
  "other-medical-services",
]);

export const medicalUiCategorySchema = z.enum([
  "consultations",
  "diagnostics",
  "optical-selection",
  "procedures",
  "laboratory",
]);

export const medicalPriceItemSchema = z
  .object({
    id: z.number().int().min(1).max(40),
    officialSection: officialPriceSectionSchema,
    uiCategory: medicalUiCategorySchema,
    officialNameUk: z.string().min(1),
    priceUah: z.number().int().positive(),
    noteUk: z.string().min(1).optional(),
  })
  .strict();

export const medicalPriceListMetaSchema = z
  .object({
    approvedOn: z.literal("2025-11-11"),
    legalEntity: z.literal("ФОП ЛЕНЬО МИРОСЛАВА ЮРІЇВНА"),
    currency: z.literal("UAH"),
    officialAddress: z.literal(
      'ЗАКАРПАТСЬКА ОБЛ., М. УЖГОРОД, вул. Гойди Юрія, 10 "а", корп. 5, прим. 436',
    ),
  })
  .strict();

export type OfficialPriceSection = z.infer<
  typeof officialPriceSectionSchema
>;
export type MedicalUiCategory = z.infer<typeof medicalUiCategorySchema>;
export type MedicalPriceItem = z.infer<typeof medicalPriceItemSchema>;
export type MedicalPriceListMeta = z.infer<
  typeof medicalPriceListMetaSchema
>;
