import {
  getCollection,
  getEntry,
  type CollectionEntry,
} from "astro:content";

export type ServiceCategory = "adult" | "pediatric" | "optical";
export type ProductCategory = "contacts" | "glasses" | "care";
export type ProductVerificationStatus =
  | "verified"
  | "pending-clinic-confirmation";

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
  readonly priceMinor: number;
  readonly currency: string;
  readonly verificationStatus: ProductVerificationStatus;
}

type ServiceEntry = CollectionEntry<"services">;
type ProductEntry = CollectionEntry<"products">;

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
    priceMinor: entry.data.priceMinor,
    currency: entry.data.currency,
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
    ({ data }) => data.status === "active",
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
  if (slug.length === 0) return null;

  const entry = await getEntry("services", slug);

  if (!entry || entry.data.status !== "active") return null;

  return mapServiceEntry(entry);
}
