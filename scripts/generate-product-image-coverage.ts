import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import { productSchema, type ProductContent } from "../src/schemas/product.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const SEED_FILE = path.join(PROJECT_ROOT, "shop_seed.json");
const SOURCE_MANIFEST_FILE = path.join(
  SCRIPT_DIR,
  "product-image-sources.json",
);
const GENERATED_MANIFEST_FILE = path.join(
  SCRIPT_DIR,
  "seed-products.manifest.json",
);
const CONTENT_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const SHOP_IMAGE_DIR = path.join(PUBLIC_DIR, "images", "shop");
const JSON_REPORT = path.join(PROJECT_ROOT, "docs", "product-image-coverage.json");
const MARKDOWN_REPORT = path.join(
  PROJECT_ROOT,
  "docs",
  "product-image-coverage.md",
);
const EXPECTED_PRODUCT_COUNT = 60;

const mimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
type AllowedMime = z.infer<typeof mimeSchema>;

const seedProductSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: z.string().regex(/^MED-INTERNAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    title: z.string().trim().min(1),
    category: z.enum(["lenses", "care", "frames", "sunglasses"]),
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
const seedSchema = z.array(seedProductSchema).length(EXPECTED_PRODUCT_COUNT);
type SeedProduct = z.infer<typeof seedProductSchema>;

const sourceEntrySchema = z
  .object({
    productId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: z.string().regex(/^MED-INTERNAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    brand: z.string().trim().min(1),
    model: z.string().trim().min(1),
    sourcePageUrl: z.string(),
    directImageUrl: z.string(),
    expectedFile: seedProductSchema.shape.image,
    expectedMime: mimeSchema,
    matchBasis: z.string().trim().min(1),
    rightsBasis: z.string().trim().min(1),
    exactMatchConfirmed: z.boolean(),
    rightsConfirmed: z.boolean(),
    retrievedAt: z.string().datetime({ offset: true }).optional(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  })
  .strict();
const sourceManifestSchema = z
  .object({
    version: z.literal(1),
    products: z.array(sourceEntrySchema).length(EXPECTED_PRODUCT_COUNT),
  })
  .strict();
type SourceEntry = z.infer<typeof sourceEntrySchema>;

const generatedManifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    ),
  })
  .strict();

interface FileInspection {
  readonly exists: boolean;
  readonly bytes: number;
  readonly detectedMime: AllowedMime | null;
  readonly rasterMagicValid: boolean;
  readonly sha256: string | null;
}

type CoverageStatus =
  | "ready"
  | "missing-local-file"
  | "invalid-local-file"
  | "manifest-mapping-invalid"
  | "sha256-mismatch"
  | "duplicate-or-misleading-mapping"
  | "source-provenance-unresolved"
  | "exact-match-unconfirmed"
  | "usage-rights-unconfirmed"
  | "generated-binding-not-ready";

interface CoverageRow {
  readonly product: string;
  readonly sku: string;
  readonly brandModel: string;
  readonly localPath: string;
  readonly fileExists: boolean;
  readonly fileValid: boolean;
  readonly detectedMime: AllowedMime | null;
  readonly expectedMime: AllowedMime;
  readonly exactMatch: boolean;
  readonly exactMatchConfirmedInManifest: boolean;
  readonly matchBasis: string;
  readonly sourcePageUrl: string | null;
  readonly directImageUrl: string | null;
  readonly provenanceConfirmed: boolean;
  readonly rightsBasis: string;
  readonly rightsConfirmed: boolean;
  readonly sha256: string | null;
  readonly manifestSha256: string | null;
  readonly renderedPath: string | null;
  readonly renderedImageKind: ProductContent["imageKind"] | null;
  readonly generatedBindingReady: boolean;
  readonly categoryFallback: boolean;
  readonly duplicateOrMisleading: boolean;
  readonly status: CoverageStatus;
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

function resolvePublicFile(publicUrl: string): string | null {
  if (!publicUrl.startsWith("/") || publicUrl.includes("\\")) return null;
  const absolute = path.resolve(PUBLIC_DIR, publicUrl.slice(1));
  const publicRoot = `${path.resolve(PUBLIC_DIR)}${path.sep}`;
  return absolute.startsWith(publicRoot) ? absolute : null;
}

function inspectPublicFile(publicUrl: string): FileInspection {
  const filePath = resolvePublicFile(publicUrl);
  if (filePath === null || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return {
      exists: false,
      bytes: 0,
      detectedMime: null,
      rasterMagicValid: false,
      sha256: null,
    };
  }
  const bytes = fs.readFileSync(filePath);
  const detectedMime = detectMime(bytes);
  return {
    exists: true,
    bytes: bytes.length,
    detectedMime,
    rasterMagicValid: bytes.length >= 512 && detectedMime !== null,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function isPublicHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".home.arpa") ||
      net.isIP(host) !== 0
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function readProductCollection(): ReadonlyMap<string, ProductContent> {
  const products = new Map<string, ProductContent>();
  if (!fs.existsSync(CONTENT_DIR)) return products;
  for (const filename of fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".json"))) {
    const filePath = path.join(CONTENT_DIR, filename);
    const parsed = productSchema.safeParse(parseJsonUnknown(filePath));
    if (!parsed.success) {
      throw new Error(`${filename} failed product schema:\n${formatZodError(parsed.error)}`);
    }
    products.set(filename.slice(0, -5), parsed.data);
  }
  return products;
}

function readGeneratedFiles(): ReadonlySet<string> {
  const parsed = parseOrThrow(
    generatedManifestSchema,
    parseJsonUnknown(GENERATED_MANIFEST_FILE),
    "seed-products.manifest.json",
  );
  return new Set(parsed.generatedFiles);
}

function extensionForMime(mime: AllowedMime): "jpg" | "png" | "webp" {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

function coverageStatus(
  inspection: FileInspection,
  mappingValid: boolean,
  shaMatches: boolean,
  duplicateOrMisleading: boolean,
  provenanceConfirmed: boolean,
  exactMatch: boolean,
  rightsConfirmed: boolean,
  generatedBindingReady: boolean,
): CoverageStatus {
  if (!inspection.exists) return "missing-local-file";
  if (!inspection.rasterMagicValid) return "invalid-local-file";
  if (!mappingValid) return "manifest-mapping-invalid";
  if (!shaMatches) return "sha256-mismatch";
  if (duplicateOrMisleading) return "duplicate-or-misleading-mapping";
  if (!provenanceConfirmed) return "source-provenance-unresolved";
  if (!exactMatch) return "exact-match-unconfirmed";
  if (!rightsConfirmed) return "usage-rights-unconfirmed";
  if (!generatedBindingReady) return "generated-binding-not-ready";
  return "ready";
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
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

function buildCoverage(): {
  readonly json: Readonly<Record<string, unknown>>;
  readonly markdown: string;
  readonly acceptancePass: boolean;
} {
  const seed = parseOrThrow(seedSchema, parseJsonUnknown(SEED_FILE), "shop_seed.json");
  const sourceManifest = parseOrThrow(
    sourceManifestSchema,
    parseJsonUnknown(SOURCE_MANIFEST_FILE),
    "product-image-sources.json",
  );
  const collection = readProductCollection();
  const generatedFiles = readGeneratedFiles();
  const seedById = new Map<string, SeedProduct>();
  const sourceById = new Map<string, SourceEntry>();
  const seedSlugs = new Set<string>();
  const seedSkus = new Set<string>();
  const sourceSlugs = new Set<string>();
  const sourceSkus = new Set<string>();

  for (const product of seed) {
    if (seedById.has(product.id)) throw new Error(`Duplicate seed ID: ${product.id}`);
    if (seedSlugs.has(product.slug)) throw new Error(`Duplicate seed slug: ${product.slug}`);
    if (seedSkus.has(product.sku)) throw new Error(`Duplicate seed SKU: ${product.sku}`);
    if (product.slug !== product.id) throw new Error(`Seed ID/slug mismatch: ${product.id}`);
    seedById.set(product.id, product);
    seedSlugs.add(product.slug);
    seedSkus.add(product.sku);
  }
  for (const source of sourceManifest.products) {
    if (sourceById.has(source.productId)) {
      throw new Error(`Duplicate source productId: ${source.productId}`);
    }
    if (sourceSlugs.has(source.slug)) throw new Error(`Duplicate source slug: ${source.slug}`);
    if (sourceSkus.has(source.sku)) throw new Error(`Duplicate source SKU: ${source.sku}`);
    sourceById.set(source.productId, source);
    sourceSlugs.add(source.slug);
    sourceSkus.add(source.sku);
  }

  const pathCounts = new Map<string, number>();
  const shaCounts = new Map<string, number>();
  for (const source of sourceManifest.products) {
    pathCounts.set(source.expectedFile, (pathCounts.get(source.expectedFile) ?? 0) + 1);
    const inspection = inspectPublicFile(source.expectedFile);
    if (inspection.sha256 !== null && inspection.rasterMagicValid) {
      shaCounts.set(inspection.sha256, (shaCounts.get(inspection.sha256) ?? 0) + 1);
    }
  }

  const rows: CoverageRow[] = [];
  for (const product of seed) {
    const source = sourceById.get(product.id);
    if (source === undefined) throw new Error(`Missing source manifest entry: ${product.id}`);
    const inspection = inspectPublicFile(source.expectedFile);
    const sourcePageValid = isPublicHttpsUrl(source.sourcePageUrl);
    const directImageValid = isPublicHttpsUrl(source.directImageUrl);
    const shaMatches =
      source.sha256 !== undefined && inspection.sha256 === source.sha256;
    const mappingValid =
      source.productId === product.id &&
      source.slug === product.id &&
      source.sku === product.sku &&
      source.brand === product.brand &&
      source.model === product.title &&
      source.expectedFile === product.image &&
      source.expectedFile.startsWith(`/images/shop/${product.category}/`) &&
      source.expectedFile.endsWith(
        `/${source.slug}.${extensionForMime(source.expectedMime)}`,
      ) &&
      inspection.detectedMime === source.expectedMime;
    const provenanceConfirmed =
      sourcePageValid && directImageValid && shaMatches && source.retrievedAt !== undefined;
    const exactMatch =
      inspection.rasterMagicValid &&
      mappingValid &&
      provenanceConfirmed &&
      source.exactMatchConfirmed;
    const rightsConfirmed = source.rightsConfirmed;
    const rendered = collection.get(product.id);
    const generatedBindingReady =
      rendered !== undefined &&
      rendered.imageKind === "product" &&
      rendered.image === source.expectedFile;
    const categoryFallback =
      rendered !== undefined &&
      (rendered.imageKind === "editorial" || rendered.image !== source.expectedFile);
    const isDuplicate =
      (pathCounts.get(source.expectedFile) ?? 0) > 1 ||
      (inspection.sha256 !== null && (shaCounts.get(inspection.sha256) ?? 0) > 1);
    const duplicateOrMisleading =
      isDuplicate || (inspection.rasterMagicValid && !exactMatch);

    rows.push({
      product: product.id,
      sku: product.sku,
      brandModel: `${product.brand} — ${product.title}`,
      localPath: source.expectedFile,
      fileExists: inspection.exists,
      fileValid:
        inspection.rasterMagicValid && inspection.detectedMime === source.expectedMime,
      detectedMime: inspection.detectedMime,
      expectedMime: source.expectedMime,
      exactMatch,
      exactMatchConfirmedInManifest: source.exactMatchConfirmed,
      matchBasis: source.matchBasis,
      sourcePageUrl: sourcePageValid ? source.sourcePageUrl : null,
      directImageUrl: directImageValid ? source.directImageUrl : null,
      provenanceConfirmed,
      rightsBasis: source.rightsBasis,
      rightsConfirmed,
      sha256: inspection.sha256,
      manifestSha256: source.sha256 ?? null,
      renderedPath: rendered?.image ?? null,
      renderedImageKind: rendered?.imageKind ?? null,
      generatedBindingReady,
      categoryFallback,
      duplicateOrMisleading,
      status: coverageStatus(
        inspection,
        mappingValid,
        shaMatches,
        duplicateOrMisleading,
        provenanceConfirmed,
        exactMatch,
        rightsConfirmed,
        generatedBindingReady,
      ),
    });
  }

  for (const source of sourceManifest.products) {
    if (!seedById.has(source.productId)) {
      throw new Error(`Orphan source manifest entry: ${source.productId}`);
    }
  }

  const manualCollectionFiles = [...collection.keys()].filter(
    (slug) => !generatedFiles.has(`${slug}.json`),
  );
  const manualDraftFiles = manualCollectionFiles.filter((slug) => {
    const product = collection.get(slug);
    return product?.status === "draft";
  });
  const canonicalExpectedPaths = new Set(rows.map((row) => row.localPath));
  const legacyRasterFiles = fs
    .readdirSync(SHOP_IMAGE_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp)$/i.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((filePath) => {
      const publicPath = `/${path.relative(PUBLIC_DIR, filePath).split(path.sep).join("/")}`;
      return !canonicalExpectedPaths.has(publicPath);
    });
  const invalidLegacyFiles = legacyRasterFiles.filter((filePath) => {
    const bytes = fs.readFileSync(filePath);
    return bytes.length < 512 || detectMime(bytes) === null;
  });

  const summary = Object.freeze({
    canonicalProducts: rows.length,
    validLocalImageFiles: rows.filter((row) => row.fileValid).length,
    exactProductMatches: rows.filter((row) => row.exactMatch).length,
    categoryFallbacks: rows.filter((row) => row.categoryFallback).length,
    missingImages: rows.filter((row) => !row.fileExists).length,
    invalidFiles: rows.filter((row) => row.fileExists && !row.fileValid).length,
    duplicateOrMisleadingMappings: rows.filter(
      (row) => row.duplicateOrMisleading,
    ).length,
    provenanceConfirmed: rows.filter((row) => row.provenanceConfirmed).length,
    rightsBasisConfirmed: rows.filter((row) => row.rightsConfirmed).length,
    generatedExactBindings: rows.filter((row) => row.generatedBindingReady).length,
    manualDraftFiles: manualDraftFiles.length,
    invalidUnreferencedLegacyFiles: invalidLegacyFiles.length,
  });

  const acceptancePass =
    summary.canonicalProducts === EXPECTED_PRODUCT_COUNT &&
    summary.validLocalImageFiles === summary.canonicalProducts &&
    summary.exactProductMatches === summary.canonicalProducts &&
    summary.categoryFallbacks === 0 &&
    summary.missingImages === 0 &&
    summary.invalidFiles === 0 &&
    summary.duplicateOrMisleadingMappings === 0 &&
    summary.provenanceConfirmed === summary.canonicalProducts &&
    summary.rightsBasisConfirmed === summary.canonicalProducts &&
    summary.generatedExactBindings === summary.canonicalProducts;

  const tableRows = rows
    .map((row) => {
      const source = row.sourcePageUrl === null ? "—" : `<${row.sourcePageUrl}>`;
      const hash = row.sha256 === null ? "—" : `\`${row.sha256}\``;
      return `| ${escapeMarkdown(`${row.product} / ${row.sku}`)} | ${escapeMarkdown(row.brandModel)} | \`${escapeMarkdown(row.localPath)}\` | ${row.fileValid ? "yes" : "no"} | ${row.exactMatch ? "yes" : "no"} | ${source} | ${escapeMarkdown(row.rightsBasis)} (${row.rightsConfirmed ? "confirmed" : "unconfirmed"}) | ${hash} | ${row.status} |`;
    })
    .join("\n");

  const markdown = `# Product image coverage\n\nGenerated deterministically from \`shop_seed.json\`, \`scripts/product-image-sources.json\`, local raster bytes, the generated-file ownership manifest, and product collection records. A URL or downloaded byte sequence is not treated as proof of an exact model or publication rights. \`MED-INTERNAL-*\` values are unique internal catalog keys, not manufacturer SKUs.\n\n## Summary\n\n\`\`\`text\nTotal canonical products: ${summary.canonicalProducts}\nValid local image files: ${summary.validLocalImageFiles}/${summary.canonicalProducts}\nExact product matches: ${summary.exactProductMatches}/${summary.canonicalProducts}\nCategory fallbacks: ${summary.categoryFallbacks}\nMissing images: ${summary.missingImages}\nInvalid files: ${summary.invalidFiles}\nDuplicate/misleading mappings: ${summary.duplicateOrMisleadingMappings}\nRights/provenance confirmed: ${summary.rightsBasisConfirmed}/${summary.canonicalProducts}\n\`\`\`\n\nAdditional evidence: provenance-confirmed ${summary.provenanceConfirmed}/${summary.canonicalProducts}; generated exact bindings ${summary.generatedExactBindings}/${summary.canonicalProducts}; preserved manual drafts ${summary.manualDraftFiles}; invalid unreferenced legacy rasters ${summary.invalidUnreferencedLegacyFiles}.\n\n## Per-product evidence\n\n| Product / internal SKU | Brand/model | Local path | File valid | Exact match | Source | Rights basis | SHA-256 | Status |\n|---|---|---|---|---|---|---|---|---|\n${tableRows}\n`;

  const json = Object.freeze({
    version: 2,
    acceptancePass,
    summary,
    products: rows,
    manualDraftFiles,
    invalidUnreferencedLegacyFiles: invalidLegacyFiles.map(
      (filePath) => `/${path.relative(PUBLIC_DIR, filePath).split(path.sep).join("/")}`,
    ),
  });
  return { json, markdown, acceptancePass };
}

try {
  const report = buildCoverage();
  const jsonChanged = writeAtomicIfChanged(
    JSON_REPORT,
    `${JSON.stringify(report.json, null, 2)}\n`,
  );
  const markdownChanged = writeAtomicIfChanged(MARKDOWN_REPORT, report.markdown);
  console.log(
    JSON.stringify(
      {
        jsonReport: path.relative(PROJECT_ROOT, JSON_REPORT),
        markdownReport: path.relative(PROJECT_ROOT, MARKDOWN_REPORT),
        jsonChanged,
        markdownChanged,
        acceptancePass: report.acceptancePass,
        summary: report.json.summary,
      },
      null,
      2,
    ),
  );
  if (!report.acceptancePass) process.exitCode = 2;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unexpected report failure");
  process.exitCode = 1;
}
