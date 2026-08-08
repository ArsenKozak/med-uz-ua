import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const requiredEditorialText = z.string().trim().min(1);

const services = defineCollection({
  loader: glob({
    base: "./src/content/services",
    pattern: "**/*.json",
  }),
  schema: z
    .object({
      title: requiredEditorialText,
      description: requiredEditorialText,
      category: z.enum(["adult", "pediatric", "optical"]),
      heroTagline: requiredEditorialText,
      keyBenefits: z.array(requiredEditorialText).min(1),
      status: z.enum(["active", "draft"]),
      metaTitle: requiredEditorialText,
      metaDescription: requiredEditorialText,
    })
    .strict(),
});

const products = defineCollection({
  loader: glob({
    base: "./src/content/products",
    pattern: "**/*.json",
  }),
  schema: z
    .object({
      title: requiredEditorialText,
      description: requiredEditorialText,
      category: z.enum(["contacts", "glasses", "care"]),
      priceMinor: z.number().int().nonnegative(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      status: z.enum(["active", "draft"]),
      verificationStatus: z.enum([
        "verified",
        "pending-clinic-confirmation",
      ]),
    })
    .strict(),
});

export const collections = { services, products };
