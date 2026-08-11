import { z } from "astro/zod";

export const PRODUCT_CATEGORIES = [
  "lenses",
  "frames",
  "sunglasses",
  "care",
] as const;

export const PRODUCT_VERIFICATION_STATUSES = [
  "verified",
  "pending-clinic-confirmation",
] as const;

const safeMinorAmount = z
  .number()
  .int()
  .nonnegative()
  .refine(Number.isSafeInteger, "Price must be a safe integer.");

export const productSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    brand: z.string().trim().min(1),
    priceMinor: safeMinorAmount,
    currency: z.string().regex(/^[A-Z]{3}$/),
    image: z
      .string()
      .regex(/^\/images\/(?:shop|artificial)\//, "Invalid product image URL."),
    imageKind: z.enum(["product", "editorial"]),
    inStock: z.boolean(),
    status: z.enum(["active", "draft"]),
    verificationStatus: z.enum(PRODUCT_VERIFICATION_STATUSES),
  })
  .strict();

export type ProductContent = z.infer<typeof productSchema>;
export type ProductCategory = ProductContent["category"];
export type ProductVerificationStatus =
  ProductContent["verificationStatus"];
export type ProductImageKind = ProductContent["imageKind"];
