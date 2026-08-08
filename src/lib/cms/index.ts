import {
  getCollection,
  getEntry,
  type CollectionEntry,
} from "astro:content";

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

type ServiceEntry = CollectionEntry<"services">;

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

function compareServicesBySlug(
  left: ServiceDetail,
  right: ServiceDetail,
): number {
  if (left.slug < right.slug) return -1;
  if (left.slug > right.slug) return 1;
  return 0;
}

export async function getAllActiveServices(): Promise<ServiceDetail[]> {
  const entries = await getCollection(
    "services",
    ({ data }) => data.status === "active",
  );

  return entries.map(mapServiceEntry).sort(compareServicesBySlug);
}

export async function getServiceBySlug(
  slug: string,
): Promise<ServiceDetail | null> {
  if (slug.length === 0) return null;

  const entry = await getEntry("services", slug);

  if (!entry || entry.data.status !== "active") return null;

  return mapServiceEntry(entry);
}
