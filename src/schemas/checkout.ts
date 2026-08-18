import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const novaPoshtaQuerySchema = z
  .object({
    action: z.enum(["searchSettlements", "getWarehouses"]),
    query: z.string().trim().max(100).optional(),
    cityRef: z.string().trim().max(100).optional(),
  })
  .strict();

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

export const customerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Вкажіть ім'я та прізвище").max(100),
    phone: z.string().trim().regex(/^(\+?38)?\s?0\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, "Некоректний номер (+380...)"),
    comment: z.string().trim().max(300).optional(),
  })
  .strict();

export const deliverySchema = z
  .object({
    provider: z.literal("nova-poshta"),
    cityName: z.string().trim().min(1),
    cityRef: z.string().trim().min(1),
    warehouseName: z.string().trim().min(1),
    warehouseRef: z.string().trim().min(1),
  })
  .strict();

export const checkoutRequestSchema = z
  .object({
    attemptId: z.string().regex(uuidRegex, "Invalid attemptId").optional(),
    customer: customerSchema,
    items: z.array(checkoutLineSchema).min(1, "Кошик порожній").max(50),
    delivery: deliverySchema,
  })
  .strict();

export const liqPayCallbackSchema = z.object({
  public_key: z.string().min(1),
  action: z.string().min(1),
  status: z.enum([
    "success",
    "error",
    "failure",
    "reversed",
    "subscribed",
    "unsubscribed",
    "processing",
    "wait_accept",
    "wait_card",
    "wait_compensation",
    "wait_secure",
  ]),
  order_id: z.string().regex(uuidRegex, "Invalid order_id"),
  payment_id: z.union([z.number(), z.string()]),
  amount: z.number().gt(0),
  currency: z.string().min(1),
  sender_phone: z.string().optional(),
  err_code: z.string().optional(),
  err_description: z.string().optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;
export type LiqPayCallbackData = z.infer<typeof liqPayCallbackSchema>;
