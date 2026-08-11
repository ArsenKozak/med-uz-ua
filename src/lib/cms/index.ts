import {
  getCollection,
  getEntry,
  type CollectionEntry,
} from "astro:content";
import type {
  ProductCategory,
  ProductImageKind,
  ProductVerificationStatus,
} from "../../schemas/product";

export type {
  ProductCategory,
  ProductImageKind,
  ProductVerificationStatus,
} from "../../schemas/product";

export type ServiceCategory = "adult" | "pediatric" | "optical";

export interface ServiceDetail {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: ServiceCategory;
  readonly heroTagline: string;
  readonly keyBenefits: readonly string[];
  readonly metaTitle: string;
  readonly metaDescription: string;
}

export interface ProductSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly brand: string;
  readonly priceMinor: number;
  readonly currency: string;
  readonly image: string;
  readonly imageKind: ProductImageKind;
  readonly inStock: boolean;
  readonly verificationStatus: ProductVerificationStatus;
}

type ServiceEntry = CollectionEntry<"services">;
type ProductEntry = CollectionEntry<"products">;

const RESERVED_SERVICE_SLUG = "programs";

function mapServiceEntry(entry: ServiceEntry): ServiceDetail {
  return {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    category: entry.data.category,
    heroTagline: entry.data.heroTagline,
    keyBenefits: [...entry.data.keyBenefits],
    metaTitle: entry.data.metaTitle,
    metaDescription: entry.data.metaDescription,
  };
}

function mapProductEntry(entry: ProductEntry): ProductSummary {
  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    category: entry.data.category,
    brand: entry.data.brand,
    priceMinor: entry.data.priceMinor,
    currency: entry.data.currency,
    image: entry.data.image,
    imageKind: entry.data.imageKind,
    inStock: entry.data.inStock,
    verificationStatus: entry.data.verificationStatus,
  };
}

function compareServicesBySlug(
  left: ServiceDetail,
  right: ServiceDetail,
): number {
  if (left.slug < right.slug) return -1;
  if (left.slug > right.slug) return 1;
  return 0;
}

function compareProductsById(
  left: ProductSummary,
  right: ProductSummary,
): number {
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export async function getAllActiveServices(): Promise<ServiceDetail[]> {
  const entries = await getCollection(
    "services",
    ({ data, id }) =>
      data.status === "active" && id !== RESERVED_SERVICE_SLUG,
  );

  return entries.map(mapServiceEntry).sort(compareServicesBySlug);
}

export async function getAllActiveProducts(): Promise<
  readonly ProductSummary[]
> {
  const entries = await getCollection(
    "products",
    ({ data }) => data.status === "active",
  );

  return entries.map(mapProductEntry).sort(compareProductsById);
}

export async function getServiceBySlug(
  slug: string,
): Promise<ServiceDetail | null> {
  if (slug.length === 0 || slug === RESERVED_SERVICE_SLUG) return null;

  const entry = await getEntry("services", slug);

  if (!entry || entry.data.status !== "active") return null;

  return mapServiceEntry(entry);
}
