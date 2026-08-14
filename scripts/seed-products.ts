import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import {
  PRODUCT_CATEGORIES,
  productSchema,
  type ProductCategory,
  type ProductContent,
} from "../src/schemas/product.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SEED_FILE = path.join(PROJECT_ROOT, "shop_seed.json");
const SOURCE_MANIFEST_FILE = path.join(
  SCRIPT_DIR,
  "product-image-sources.json",
);
const GENERATED_MANIFEST_FILE = path.join(
  SCRIPT_DIR,
  "seed-products.manifest.json",
);
const TARGET_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const EXPECTED_PRODUCT_COUNT = 60;

const mimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
type AllowedMime = z.infer<typeof mimeSchema>;

const sourceProductSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: z.string().regex(/^MED-INTERNAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    title: z.string().trim().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    brand: z.string().trim().min(1),
    price: z.number().int().positive().refine(Number.isSafeInteger),
    inStock: z.boolean(),
    image: z
      .string()
      .regex(
        /^\/images\/shop\/(?:lenses|care|frames|sunglasses)\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/,
      ),
    description: z.string().trim().min(1),
  })
  .strict();
const sourceCatalogSchema = z
  .array(sourceProductSchema)
  .length(EXPECTED_PRODUCT_COUNT);
type SourceProduct = z.infer<typeof sourceProductSchema>;

const imageSourceSchema = z
  .object({
    productId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: z.string().regex(/^MED-INTERNAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    brand: z.string().trim().min(1),
    model: z.string().trim().min(1),
    sourcePageUrl: z.string(),
    directImageUrl: z.string(),
    expectedFile: sourceProductSchema.shape.image,
    expectedMime: mimeSchema,
    matchBasis: z.string().trim().min(1),
    rightsBasis: z.string().trim().min(1),
    exactMatchConfirmed: z.boolean(),
    rightsConfirmed: z.boolean(),
    retrievedAt: z.string().datetime({ offset: true }).optional(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  })
  .strict();
const imageSourceManifestSchema = z
  .object({
    version: z.literal(1),
    products: z.array(imageSourceSchema).length(EXPECTED_PRODUCT_COUNT),
  })
  .strict();
type ImageSource = z.infer<typeof imageSourceSchema>;

const generatedManifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    ),
  })
  .strict();

interface PreparedProduct {
  readonly id: string;
  readonly content: ProductContent;
}

function parseJsonUnknown(filePath: string): unknown {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`${path.relative(PROJECT_ROOT, filePath)} is invalid JSON: ${detail}`);
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("\n");
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} failed validation:\n${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

function detectMime(bytes: Buffer): AllowedMime | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes.at(-2) === 0xff &&
    bytes.at(-1) === 0xd9
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ) &&
    bytes.includes(Buffer.from("IEND"))
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function extensionForMime(mime: AllowedMime): "jpg" | "png" | "webp" {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

function resolvePublicFile(publicUrl: string): string {
  const absolute = path.resolve(PUBLIC_DIR, publicUrl.slice(1));
  const publicRoot = `${path.resolve(PUBLIC_DIR)}${path.sep}`;
  if (!publicUrl.startsWith("/") || !absolute.startsWith(publicRoot)) {
    throw new Error(`Unsafe public image path: ${publicUrl}`);
  }
  return absolute;
}

function validPublicHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".home.arpa")
    ) {
      return false;
    }
    if (net.isIP(host) !== 0) return false;
    return true;
  } catch {
    return false;
  }
}

function hashBytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function readSourceCatalog(): readonly SourceProduct[] {
  return parseOrThrow(
    sourceCatalogSchema,
    parseJsonUnknown(SEED_FILE),
    "shop_seed.json",
  );
}

function readImageSources(): readonly ImageSource[] {
  return parseOrThrow(
    imageSourceManifestSchema,
    parseJsonUnknown(SOURCE_MANIFEST_FILE),
    "product-image-sources.json",
  ).products;
}

function readOwnedGeneratedFiles(): ReadonlySet<string> {
  if (!fs.existsSync(GENERATED_MANIFEST_FILE)) return new Set<string>();
  const manifest = parseOrThrow(
    generatedManifestSchema,
    parseJsonUnknown(GENERATED_MANIFEST_FILE),
    "seed-products.manifest.json",
  );
  return new Set(manifest.generatedFiles);
}

function prepareProducts(): readonly PreparedProduct[] {
  const products = readSourceCatalog();
  const imageSources = readImageSources();
  const productById = new Map<string, SourceProduct>();
  const sourceById = new Map<string, ImageSource>();
  const seedSlugs = new Set<string>();
  const seedSkus = new Set<string>();
  const sourceSlugs = new Set<string>();
  const sourceSkus = new Set<string>();
  const expectedFiles = new Set<string>();
  const shaOwners = new Map<string, string>();
  const blockers: string[] = [];

  for (const product of products) {
    if (productById.has(product.id)) blockers.push(`${product.id}:duplicate-seed-id`);
    if (seedSlugs.has(product.slug)) blockers.push(`${product.id}:duplicate-seed-slug`);
    if (seedSkus.has(product.sku)) blockers.push(`${product.id}:duplicate-seed-internal-sku`);
    if (product.slug !== product.id) blockers.push(`${product.id}:seed-id-slug-mismatch`);
    productById.set(product.id, product);
    seedSlugs.add(product.slug);
    seedSkus.add(product.sku);
  }
  for (const source of imageSources) {
    if (sourceById.has(source.productId)) {
      blockers.push(`${source.productId}:duplicate-source-entry`);
    }
    if (sourceSlugs.has(source.slug)) {
      blockers.push(`${source.productId}:duplicate-source-slug`);
    }
    if (sourceSkus.has(source.sku)) {
      blockers.push(`${source.productId}:duplicate-source-internal-sku`);
    }
    sourceById.set(source.productId, source);
    sourceSlugs.add(source.slug);
    sourceSkus.add(source.sku);
  }

  const prepared: PreparedProduct[] = [];
  for (const product of products) {
    const source = sourceById.get(product.id);
    if (source === undefined) {
      blockers.push(`${product.id}:missing-source-manifest-entry`);
      continue;
    }
    if (source.slug !== product.id) blockers.push(`${product.id}:slug-mismatch`);
    if (source.sku !== product.sku) blockers.push(`${product.id}:internal-sku-mismatch`);
    if (source.brand !== product.brand) blockers.push(`${product.id}:brand-mismatch`);
    if (source.model !== product.title) blockers.push(`${product.id}:model-mismatch`);
    if (source.expectedFile !== product.image) {
      blockers.push(`${product.id}:seed-image-does-not-match-manifest`);
    }
    if (!source.expectedFile.startsWith(`/images/shop/${product.category}/`)) {
      blockers.push(`${product.id}:image-category-mismatch`);
    }
    if (
      !source.expectedFile.endsWith(
        `/${source.slug}.${extensionForMime(source.expectedMime)}`,
      )
    ) {
      blockers.push(`${product.id}:non-deterministic-image-filename`);
    }
    if (expectedFiles.has(source.expectedFile)) {
      blockers.push(`${product.id}:duplicate-image-path`);
    }
    expectedFiles.add(source.expectedFile);
    if (!validPublicHttpsUrl(source.sourcePageUrl)) {
      blockers.push(`${product.id}:source-page-not-approved-https`);
    }
    if (!validPublicHttpsUrl(source.directImageUrl)) {
      blockers.push(`${product.id}:direct-image-not-approved-https`);
    }
    if (!source.exactMatchConfirmed) blockers.push(`${product.id}:exact-match-unconfirmed`);
    if (!source.rightsConfirmed) blockers.push(`${product.id}:usage-rights-unconfirmed`);
    if (source.sha256 === undefined) blockers.push(`${product.id}:sha256-missing`);

    const filePath = resolvePublicFile(source.expectedFile);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      blockers.push(`${product.id}:local-image-missing`);
      continue;
    }
    const bytes = fs.readFileSync(filePath);
    if (bytes.length < 512) blockers.push(`${product.id}:local-image-too-small`);
    if (detectMime(bytes) !== source.expectedMime) {
      blockers.push(`${product.id}:local-image-mime-or-magic-mismatch`);
    }
    const actualSha = hashBytes(bytes);
    if (source.sha256 !== actualSha) blockers.push(`${product.id}:local-image-sha256-mismatch`);
    const priorOwner = shaOwners.get(actualSha);
    if (priorOwner !== undefined && priorOwner !== product.id) {
      blockers.push(`${product.id}:duplicate-image-bytes-with:${priorOwner}`);
    } else {
      shaOwners.set(actualSha, product.id);
    }

    const normalized = productSchema.safeParse({
      title: product.title,
      description: product.description,
      category: product.category,
      brand: product.brand,
      priceMinor: product.price * 100,
      currency: "UAH",
      image: source.expectedFile,
      imageKind: "product",
      inStock: product.inStock,
      status: "active",
      verificationStatus: "verified",
    });
    if (!normalized.success) {
      blockers.push(`${product.id}:normalized-product-invalid`);
      continue;
    }
    prepared.push({ id: product.id, content: normalized.data });
  }

  for (const source of imageSources) {
    if (!productById.has(source.productId)) {
      blockers.push(`${source.productId}:orphan-source-manifest-entry`);
    }
  }

  if (blockers.length > 0 || prepared.length !== EXPECTED_PRODUCT_COUNT) {
    const blockerLines = blockers.map((blocker) => `- ${blocker}`).join("\n");
    throw new Error(
      `Product generation is blocked until all ${EXPECTED_PRODUCT_COUNT} exact-model assets and publication rights are verified.\n${blockerLines}`,
    );
  }
  return prepared.sort((left, right) => left.id.localeCompare(right.id));
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeAtomicIfChanged(filePath: string, content: string): boolean {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === content) {
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, content, { encoding: "utf8", mode: 0o644, flag: "wx" });
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return true;
}

function compileProducts(): void {
  const argumentsAfterScript = process.argv.slice(2);
  if (argumentsAfterScript.length > 0) {
    throw new Error(
      `Unsupported argument(s): ${argumentsAfterScript.join(" ")}. There is no allow-missing or fallback mode.`,
    );
  }
  const prepared = prepareProducts();
  const ownedFiles = readOwnedGeneratedFiles();
  const nextFiles = prepared.map(({ id }) => `${id}.json`);

  for (const filename of nextFiles) {
    const destination = path.join(TARGET_DIR, filename);
    if (fs.existsSync(destination) && !ownedFiles.has(filename)) {
      throw new Error(`Refusing to overwrite non-seed-owned product: ${destination}`);
    }
  }

  let filesChanged = 0;
  let filesUnchanged = 0;
  for (const product of prepared) {
    const changed = writeAtomicIfChanged(
      path.join(TARGET_DIR, `${product.id}.json`),
      serializeJson(product.content),
    );
    if (changed) filesChanged += 1;
    else filesUnchanged += 1;
  }

  const nextSet = new Set(nextFiles);
  let staleGeneratedFilesRemoved = 0;
  for (const filename of ownedFiles) {
    if (nextSet.has(filename)) continue;
    const stalePath = path.join(TARGET_DIR, filename);
    if (fs.existsSync(stalePath)) {
      fs.unlinkSync(stalePath);
      staleGeneratedFilesRemoved += 1;
    }
  }

  writeAtomicIfChanged(
    GENERATED_MANIFEST_FILE,
    serializeJson({ version: 1, generatedFiles: nextFiles }),
  );

  const categoryCounts: Record<ProductCategory, number> = {
    lenses: 0,
    care: 0,
    frames: 0,
    sunglasses: 0,
  };
  for (const product of prepared) categoryCounts[product.content.category] += 1;
  console.log(
    JSON.stringify(
      {
        canonicalProducts: prepared.length,
        exactProductImages: prepared.length,
        categoryFallbacks: 0,
        filesChanged,
        filesUnchanged,
        staleGeneratedFilesRemoved,
        categoryCounts,
      },
      null,
      2,
    ),
  );
}

try {
  compileProducts();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unexpected seed failure");
  process.exitCode = 1;
}
