import { z } from "zod";

const opaqueReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[^\u0000-\u001f\u007f]+$/, "Reference contains control characters.");

export const checkoutLineSchema = z
  .object({
    productId: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    quantity: z.number().int().min(1).max(20),
  })
  .strict();

export const novaPoshtaSelectionSchema = z
  .object({
    provider: z.literal("nova-poshta"),
    cityRef: opaqueReferenceSchema,
    warehouseRef: opaqueReferenceSchema,
    pointType: z.enum(["department", "parcel-locker"]),
  })
  .strict();

export const checkoutRequestSchema = z
  .object({
    items: z.array(checkoutLineSchema).min(1).max(50),
    delivery: novaPoshtaSelectionSchema,
  })
  .strict();

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;
export type NovaPoshtaSelection = z.infer<typeof novaPoshtaSelectionSchema>;
