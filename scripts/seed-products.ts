import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import {
  PRODUCT_CATEGORIES,
  productSchema,
  type ProductCategory,
  type ProductContent,
  type ProductImageKind,
} from "../src/schemas/product.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SEED_FILE = path.join(PROJECT_ROOT, "shop_seed.json");
const TARGET_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const MANIFEST_FILE = path.join(SCRIPT_DIR, "seed-products.manifest.json");
const PROVENANCE_FILE = path.join(
  PROJECT_ROOT,
  "public",
  "images",
  "shop",
  "image-sources.tsv",
);
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const EXPECTED_SEED_COUNT = 60;

const EDITORIAL_IMAGE_BY_CATEGORY = {
  lenses: "/images/artificial/macro-lens-hydration.jpg",
  care: "/images/artificial/macro-lens-hydration.jpg",
  frames: "/images/artificial/shop-editorial-eyewear.jpg",
  sunglasses: "/images/artificial/shop-editorial-eyewear.jpg",
} as const satisfies Record<ProductCategory, string>;

const sourceProductSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID must already be a URL-safe slug."),
    title: z.string().trim().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    brand: z.string().trim().min(1),
    price: z
      .number()
      .int()
      .positive()
      .refine(Number.isSafeInteger, "Price must be a safe integer."),
    inStock: z.boolean(),
    image: z
      .string()
      .regex(
        /^\/images\/shop\/(?:lenses|frames|sunglasses|care)\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|avif)$/i,
        "Image must be a local shop raster path.",
      )
      .refine(
        (value) => !value.includes("..") && !value.includes("\\"),
        "Image path traversal is forbidden.",
      ),
    description: z.string().trim().min(1),
  })
  .strict();

const sourceCatalogSchema = z
  .array(sourceProductSchema)
  .length(
    EXPECTED_SEED_COUNT,
    `shop_seed.json must contain exactly ${EXPECTED_SEED_COUNT} products.`,
  );

const manifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    ),
  })
  .strict();

type SourceProduct = z.infer<typeof sourceProductSchema>;

interface ApprovedImageEvidence {
  readonly image: string;
  readonly sha256: string;
}

interface ImageResolution {
  readonly image: string;
  readonly imageKind: ProductImageKind;
  readonly requestedImageExists: boolean;
  readonly usedApprovedExactImage: boolean;
  readonly usedEditorialFallback: boolean;
}

interface NormalizedProduct {
  readonly id: string;
  readonly product: ProductContent;
  readonly imageResolution: ImageResolution;
}

interface CompilerStats {
  readonly expectedSeedRecordCount: number;
  readonly sourceRecordCount: number;
  readonly validRecordCount: number;
  readonly uniqueRecordCount: number;
  readonly generatedRecordCount: number;
  readonly requestedImageExistsCount: number;
  readonly requestedImageMissingCount: number;
  readonly approvedExactImageCount: number;
  readonly editorialImageFallbackCount: number;
  readonly invalidGeneratedImageCount: number;
  readonly filesCreatedOrUpdated: number;
  readonly filesUnchanged: number;
  readonly staleGeneratedFilesRemoved: number;
  readonly categoryCounts: Readonly<Record<ProductCategory, number>>;
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${pathLabel}: ${issue.message}`;
    })
    .join("\n");
}

function stripJsonComments(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;
  let inBlockComment = false;
  let inLineComment = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? "";
    const nextCharacter = input[index + 1] ?? "";

    if (inBlockComment) {
      if (character === "*" && nextCharacter === "/") {
        inBlockComment = false;
        index += 1;
      } else if (character === "\n") {
        output += "\n";
      }
      continue;
    }

    if (inLineComment) {
      if (character === "\n") {
        inLineComment = false;
        output += "\n";
      }
      continue;
    }

    if (inString) {
      output += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      output += character;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    output += character;
  }

  if (inBlockComment || inString) {
    throw new Error("shop_seed.json contains an unterminated comment or string.");
  }

  return output;
}

function parseJsonUnknown(rawJson: string, sourceName: string): unknown {
  try {
    return JSON.parse(rawJson) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON error";
    throw new Error(`${sourceName} is not valid JSON: ${message}`);
  }
}

function readSourceCatalog(): readonly SourceProduct[] {
  if (!fs.existsSync(SEED_FILE)) {
    throw new Error(`Seed file not found: ${SEED_FILE}`);
  }

  const rawData = fs.readFileSync(SEED_FILE, "utf8");
  const parsedData = parseJsonUnknown(stripJsonComments(rawData), SEED_FILE);
  const result = sourceCatalogSchema.safeParse(parsedData);

  if (!result.success) {
    throw new Error(`Invalid product seed:\n${formatZodError(result.error)}`);
  }

  for (const product of result.data) {
    if (!product.image.startsWith(`/images/shop/${product.category}/`)) {
      throw new Error(
        `Seed image category does not match ${product.id}: ${product.image}`,
      );
    }
  }

  return result.data;
}

function resolvePublicFile(imageUrl: string): string | null {
  if (!imageUrl.startsWith("/images/") || imageUrl.includes("\\")) {
    return null;
  }

  const absolutePath = path.resolve(PUBLIC_DIR, imageUrl.slice(1));
  const publicRoot = `${path.resolve(PUBLIC_DIR)}${path.sep}`;

  return absolutePath.startsWith(publicRoot) ? absolutePath : null;
}

function isDecodableRasterImage(filePath: string): boolean {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 512) return false;

  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  const isWebp =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  const isAvif =
    bytes.length >= 12 &&
    bytes.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(bytes.toString("ascii", 8, 12));

  return isJpeg || isPng || isWebp || isAvif;
}

function isValidPublicImage(imageUrl: string): boolean {
  const filePath = resolvePublicFile(imageUrl);
  return filePath !== null && isDecodableRasterImage(filePath);
}

function hashFile(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function parseTsv(filePath: string): readonly Readonly<Record<string, string>>[] {
  if (!fs.existsSync(filePath)) return [];

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const headers = (lines[0] ?? "").split("\t");
  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    return Object.freeze(
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
  });
}

function readApprovedExactImages(): ReadonlyMap<string, ApprovedImageEvidence> {
  const approved = new Map<string, ApprovedImageEvidence>();

  for (const row of parseTsv(PROVENANCE_FILE)) {
    if (
      row.usage_rights !== "approved-for-site" ||
      row.exact_match_confidence !== "exact"
    ) {
      continue;
    }

    const productId = row.product_id ?? "";
    const category = row.category ?? "";
    const filename = row.file ?? "";
    const sourcePage = row.source_page ?? "";
    const sourceAsset = row.source_asset ?? "";
    const expectedSha = row.sha256 ?? "";

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId) ||
      !PRODUCT_CATEGORIES.includes(category as ProductCategory) ||
      path.basename(filename) !== filename ||
      !/^https:\/\//.test(sourcePage) ||
      !/^https:\/\//.test(sourceAsset) ||
      !/^[a-f0-9]{64}$/.test(expectedSha)
    ) {
      throw new Error(
        `Approved provenance row for ${productId || "unknown product"} is incomplete or unsafe.`,
      );
    }

    const image = `/images/shop/${category}/${filename}`;
    const filePath = resolvePublicFile(image);
    if (
      filePath === null ||
      !isDecodableRasterImage(filePath) ||
      hashFile(filePath) !== expectedSha
    ) {
      throw new Error(`Approved image evidence does not match bytes for ${productId}.`);
    }

    if (approved.has(productId)) {
      throw new Error(`Multiple approved exact images are recorded for ${productId}.`);
    }

    approved.set(productId, Object.freeze({ image, sha256: expectedSha }));
  }

  return approved;
}

function resolveProductImage(
  sourceProduct: SourceProduct,
  approvedImages: ReadonlyMap<string, ApprovedImageEvidence>,
): ImageResolution {
  const requestedImageExists = isValidPublicImage(sourceProduct.image);
  const approvedImage = approvedImages.get(sourceProduct.id);

  if (approvedImage !== undefined) {
    if (!approvedImage.image.startsWith(`/images/shop/${sourceProduct.category}/`)) {
      throw new Error(
        `Approved image category does not match ${sourceProduct.id}: ${approvedImage.image}`,
      );
    }
    return {
      image: approvedImage.image,
      imageKind: "product",
      requestedImageExists,
      usedApprovedExactImage: true,
      usedEditorialFallback: false,
    };
  }

  const editorialImage = EDITORIAL_IMAGE_BY_CATEGORY[sourceProduct.category];
  if (!isValidPublicImage(editorialImage)) {
    throw new Error(
      `No valid editorial fallback is available for ${sourceProduct.id}: ${editorialImage}`,
    );
  }

  return {
    image: editorialImage,
    imageKind: "editorial",
    requestedImageExists,
    usedApprovedExactImage: false,
    usedEditorialFallback: true,
  };
}

function normalizeProduct(
  sourceProduct: SourceProduct,
  approvedImages: ReadonlyMap<string, ApprovedImageEvidence>,
): NormalizedProduct {
  const imageResolution = resolveProductImage(sourceProduct, approvedImages);
  const priceMinor = sourceProduct.price * 100;

  if (!Number.isSafeInteger(priceMinor)) {
    throw new Error(`Unsafe price for product ${sourceProduct.id}.`);
  }

  const result = productSchema.safeParse({
    title: sourceProduct.title,
    description: sourceProduct.description,
    category: sourceProduct.category,
    brand: sourceProduct.brand,
    priceMinor,
    currency: "UAH",
    image: imageResolution.image,
    imageKind: imageResolution.imageKind,
    inStock: sourceProduct.inStock,
    status: "active",
    verificationStatus: "verified",
  });

  if (!result.success) {
    throw new Error(
      `Normalized product ${sourceProduct.id} is invalid:\n${formatZodError(result.error)}`,
    );
  }

  return { id: sourceProduct.id, product: result.data, imageResolution };
}

function readOwnedGeneratedFiles(): ReadonlySet<string> {
  if (!fs.existsSync(MANIFEST_FILE)) {
    return new Set<string>();
  }

  const parsedManifest = parseJsonUnknown(
    fs.readFileSync(MANIFEST_FILE, "utf8"),
    MANIFEST_FILE,
  );
  const result = manifestSchema.safeParse(parsedManifest);

  if (!result.success) {
    throw new Error(`Invalid seed manifest:\n${formatZodError(result.error)}`);
  }

  return new Set(result.data.generatedFiles);
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
    `.${path.basename(filePath)}.${process.pid}.tmp`,
  );

  try {
    fs.writeFileSync(temporary, content, { encoding: "utf8", mode: 0o644 });
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }

  return true;
}

function verifyWrittenCatalog(generatedFiles: readonly string[]): void {
  for (const filename of generatedFiles) {
    const filePath = path.join(TARGET_DIR, filename);
    const parsedProduct = parseJsonUnknown(
      fs.readFileSync(filePath, "utf8"),
      filePath,
    );
    const result = productSchema.safeParse(parsedProduct);

    if (!result.success) {
      throw new Error(
        `Generated product ${filename} failed verification:\n${formatZodError(result.error)}`,
      );
    }

    if (!isValidPublicImage(result.data.image)) {
      throw new Error(
        `Generated product ${filename} references an invalid image: ${result.data.image}`,
      );
    }
  }
}

function compileProducts(): CompilerStats {
  const cliArguments = process.argv.slice(2);
  if (cliArguments.length > 0) {
    throw new Error(
      `Unsupported seed argument(s): ${cliArguments.join(" ")}. Missing exact images are handled only by labeled editorial fallbacks, never by an allow-missing flag.`,
    );
  }

  const sourceProducts = readSourceCatalog();
  const approvedImages = readApprovedExactImages();
  const normalizedProducts = sourceProducts.map((product) =>
    normalizeProduct(product, approvedImages),
  );
  const productsById = new Map<string, NormalizedProduct>();

  for (const normalizedProduct of normalizedProducts) {
    if (productsById.has(normalizedProduct.id)) {
      throw new Error(`Duplicate canonical product ID: ${normalizedProduct.id}`);
    }
    productsById.set(normalizedProduct.id, normalizedProduct);
  }

  const sortedProducts = [...productsById.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const generatedFiles = sortedProducts.map(({ id }) => `${id}.json`);
  const ownedGeneratedFiles = readOwnedGeneratedFiles();

  for (const filename of generatedFiles) {
    const filePath = path.join(TARGET_DIR, filename);
    if (fs.existsSync(filePath) && !ownedGeneratedFiles.has(filename)) {
      throw new Error(
        `Seed output would overwrite a non-seed-owned file: ${filePath}`,
      );
    }
  }

  let filesCreatedOrUpdated = 0;
  let filesUnchanged = 0;

  for (const { id, product } of sortedProducts) {
    const changed = writeAtomicIfChanged(
      path.join(TARGET_DIR, `${id}.json`),
      serializeJson(product),
    );
    if (changed) filesCreatedOrUpdated += 1;
    else filesUnchanged += 1;
  }

  const nextGeneratedFileSet = new Set(generatedFiles);
  let staleGeneratedFilesRemoved = 0;
  for (const staleFilename of ownedGeneratedFiles) {
    if (nextGeneratedFileSet.has(staleFilename)) continue;

    const staleFilePath = path.join(TARGET_DIR, staleFilename);
    if (fs.existsSync(staleFilePath)) {
      fs.unlinkSync(staleFilePath);
      staleGeneratedFilesRemoved += 1;
    }
  }

  writeAtomicIfChanged(
    MANIFEST_FILE,
    serializeJson({ version: 1, generatedFiles }),
  );
  verifyWrittenCatalog(generatedFiles);

  const categoryCounts: Record<ProductCategory, number> = {
    lenses: 0,
    frames: 0,
    sunglasses: 0,
    care: 0,
  };
  for (const { product } of sortedProducts) {
    categoryCounts[product.category] += 1;
  }

  const requestedImageExistsCount = normalizedProducts.filter(
    ({ imageResolution }) => imageResolution.requestedImageExists,
  ).length;

  return {
    expectedSeedRecordCount: EXPECTED_SEED_COUNT,
    sourceRecordCount: sourceProducts.length,
    validRecordCount: normalizedProducts.length,
    uniqueRecordCount: productsById.size,
    generatedRecordCount: generatedFiles.length,
    requestedImageExistsCount,
    requestedImageMissingCount:
      normalizedProducts.length - requestedImageExistsCount,
    approvedExactImageCount: normalizedProducts.filter(
      ({ imageResolution }) => imageResolution.usedApprovedExactImage,
    ).length,
    editorialImageFallbackCount: normalizedProducts.filter(
      ({ imageResolution }) => imageResolution.usedEditorialFallback,
    ).length,
    invalidGeneratedImageCount: 0,
    filesCreatedOrUpdated,
    filesUnchanged,
    staleGeneratedFilesRemoved,
    categoryCounts,
  };
}

try {
  const stats = compileProducts();
  console.log(JSON.stringify(stats, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error(message);
  process.exitCode = 1;
}
