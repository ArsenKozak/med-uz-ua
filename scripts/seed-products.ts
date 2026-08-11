import fs from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import {
  productSchema,
  type ProductCategory,
  type ProductContent,
  type ProductImageKind,
} from "../src/schemas/product.ts";

const PROJECT_ROOT = process.cwd();
const SEED_FILE = path.join(PROJECT_ROOT, "shop_seed.json");
const TARGET_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const MANIFEST_FILE = path.join(
  PROJECT_ROOT,
  "scripts",
  "seed-products.manifest.json",
);
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

const LEGACY_CATEGORY_MAP = {
  contacts: "lenses",
  glasses: "frames",
} as const satisfies Record<string, ProductCategory>;

const EDITORIAL_IMAGE_BY_CATEGORY = {
  lenses: "/images/artificial/macro-lens-hydration.jpg",
  care: "/images/artificial/macro-lens-hydration.jpg",
  frames: "/images/artificial/shop-editorial-eyewear.jpg",
  sunglasses: "/images/artificial/shop-editorial-eyewear.jpg",
} as const satisfies Record<ProductCategory, string>;

const VERIFIED_PRODUCT_IMAGE_BY_ID: Readonly<Record<string, string>> = {
  "lens-air-optix-night-day-1": "/images/shop/lenses/lens-product-19.jpg",
  "lens-biofinity-2": "/images/shop/lenses/lens-product-11.jpg",
  "lens-dailies-total-1-4": "/images/shop/lenses/lens-product-03.jpg",
  "lens-ultra-bausch-lomb-5": "/images/shop/lenses/lens-product-22.jpg",
  "lens-air-optix-plus-8": "/images/shop/lenses/lens-product-20.jpg",
  "care-biotrue-solution-1": "/images/shop/care/care-solution-01.jpg",
  "care-renu-multiplus-5": "/images/shop/care/care-solution-03.jpg",
  "care-ao-sept-plus-6": "/images/shop/lenses/lens-product-15.jpg",
  "sunglass-polaroid-classic-1":
    "/images/shop/sunglasses/sunglass-polaroid-classic-02.jpg",
  "sunglass-rayban-aviator-2":
    "/images/shop/sunglasses/sunglass-rayban-aviator-01.jpg",
};

const sourceCategorySchema = z.enum([
  "lenses",
  "frames",
  "sunglasses",
  "care",
  "contacts",
  "glasses",
]);

const sourceProductSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    category: sourceCategorySchema,
    brand: z.string().trim().min(1),
    price: z
      .number()
      .int()
      .nonnegative()
      .refine(Number.isSafeInteger, "Price must be a safe integer."),
    inStock: z.boolean(),
    image: z.string().startsWith("/images/"),
    description: z.string().trim().min(1),
  })
  .strict();

const sourceCatalogSchema = z.array(sourceProductSchema).min(1);

const manifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/)),
  })
  .strict();

type SourceProduct = z.infer<typeof sourceProductSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${pathLabel}: ${issue.message}`;
    })
    .join("\n");
}

interface ImageResolution {
  readonly image: string;
  readonly imageKind: ProductImageKind;
  readonly sourceImageMissing: boolean;
  readonly usedVerifiedOverride: boolean;
  readonly usedEditorialFallback: boolean;
}

interface CompilerStats {
  readonly sourceRecordCount: number;
  readonly validRecordCount: number;
  readonly uniqueRecordCount: number;
  readonly generatedRecordCount: number;
  readonly duplicateCollisionCount: number;
  readonly sourceImageMissingCount: number;
  readonly verifiedImageOverrideCount: number;
  readonly editorialImageFallbackCount: number;
  readonly normalizedMissingImageCount: number;
  readonly filesCreatedOrUpdated: number;
  readonly filesUnchanged: number;
  readonly staleGeneratedFilesRemoved: number;
  readonly categoryCounts: Readonly<Record<ProductCategory, number>>;
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
    return JSON.parse(rawJson);
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

  return result.data;
}

function normalizeProductCategory(
  category: SourceProduct["category"],
): ProductCategory {
  if (category === "contacts" || category === "glasses") {
    return LEGACY_CATEGORY_MAP[category];
  }

  return category;
}

function deriveCanonicalId(sourceId: string): string {
  const canonicalId = sourceId
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (canonicalId.length === 0) {
    throw new Error(`Product ID cannot be normalized: ${sourceId}`);
  }

  return canonicalId;
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

  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isWebp =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";

  return isJpeg || isPng || isWebp;
}

function isValidPublicImage(imageUrl: string): boolean {
  const filePath = resolvePublicFile(imageUrl);
  return filePath !== null && isDecodableRasterImage(filePath);
}

function resolveProductImage(
  sourceProduct: SourceProduct,
  category: ProductCategory,
  canonicalId: string,
): ImageResolution {
  if (isValidPublicImage(sourceProduct.image)) {
    return {
      image: sourceProduct.image,
      imageKind: "product",
      sourceImageMissing: false,
      usedVerifiedOverride: false,
      usedEditorialFallback: false,
    };
  }

  const verifiedImage = VERIFIED_PRODUCT_IMAGE_BY_ID[canonicalId];

  if (verifiedImage !== undefined && isValidPublicImage(verifiedImage)) {
    return {
      image: verifiedImage,
      imageKind: "product",
      sourceImageMissing: true,
      usedVerifiedOverride: true,
      usedEditorialFallback: false,
    };
  }

  const editorialImage = EDITORIAL_IMAGE_BY_CATEGORY[category];

  if (!isValidPublicImage(editorialImage)) {
    throw new Error(
      `No valid image is available for ${canonicalId}: ${editorialImage}`,
    );
  }

  return {
    image: editorialImage,
    imageKind: "editorial",
    sourceImageMissing: true,
    usedVerifiedOverride: false,
    usedEditorialFallback: true,
  };
}

function normalizeProduct(sourceProduct: SourceProduct): {
  readonly id: string;
  readonly product: ProductContent;
  readonly imageResolution: ImageResolution;
} {
  const id = deriveCanonicalId(sourceProduct.id);
  const category = normalizeProductCategory(sourceProduct.category);
  const imageResolution = resolveProductImage(sourceProduct, category, id);
  const priceMinor = sourceProduct.price * 100;

  if (!Number.isSafeInteger(priceMinor)) {
    throw new Error(`Unsafe price for product ${id}.`);
  }

  const result = productSchema.safeParse({
    title: sourceProduct.title,
    description: sourceProduct.description,
    category,
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
      `Normalized product ${id} is invalid:\n${formatZodError(result.error)}`,
    );
  }

  return { id, product: result.data, imageResolution };
}

function readOwnedGeneratedFiles(): ReadonlySet<string> {
  if (!fs.existsSync(MANIFEST_FILE)) {
    return new Set<string>();
  }

  const rawManifest = fs.readFileSync(MANIFEST_FILE, "utf8");
  const parsedManifest = parseJsonUnknown(rawManifest, MANIFEST_FILE);
  const result = manifestSchema.safeParse(parsedManifest);

  if (!result.success) {
    throw new Error(`Invalid seed manifest:\n${formatZodError(result.error)}`);
  }

  return new Set(result.data.generatedFiles);
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
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
  const sourceProducts = readSourceCatalog();
  const normalizedProducts = sourceProducts.map(normalizeProduct);
  const productsById = new Map<string, (typeof normalizedProducts)[number]>();

  for (const normalizedProduct of normalizedProducts) {
    if (productsById.has(normalizedProduct.id)) {
      throw new Error(
        `Duplicate canonical product ID: ${normalizedProduct.id}`,
      );
    }

    productsById.set(normalizedProduct.id, normalizedProduct);
  }

  const sortedProducts = [...productsById.values()].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
  const generatedFiles = sortedProducts.map(({ id }) => `${id}.json`);
  const ownedGeneratedFiles = readOwnedGeneratedFiles();

  fs.mkdirSync(TARGET_DIR, { recursive: true });

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
    const filePath = path.join(TARGET_DIR, `${id}.json`);
    const serializedProduct = serializeJson(product);

    if (
      fs.existsSync(filePath) &&
      fs.readFileSync(filePath, "utf8") === serializedProduct
    ) {
      filesUnchanged += 1;
      continue;
    }

    fs.writeFileSync(filePath, serializedProduct, "utf8");
    filesCreatedOrUpdated += 1;
  }

  const nextGeneratedFileSet = new Set(generatedFiles);
  let staleGeneratedFilesRemoved = 0;

  for (const staleFilename of ownedGeneratedFiles) {
    if (nextGeneratedFileSet.has(staleFilename)) {
      continue;
    }

    const staleFilePath = path.join(TARGET_DIR, staleFilename);

    if (fs.existsSync(staleFilePath)) {
      fs.unlinkSync(staleFilePath);
      staleGeneratedFilesRemoved += 1;
    }
  }

  fs.writeFileSync(
    MANIFEST_FILE,
    serializeJson({ version: 1, generatedFiles }),
    "utf8",
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

  return {
    sourceRecordCount: sourceProducts.length,
    validRecordCount: normalizedProducts.length,
    uniqueRecordCount: productsById.size,
    generatedRecordCount: generatedFiles.length,
    duplicateCollisionCount: 0,
    sourceImageMissingCount: normalizedProducts.filter(
      ({ imageResolution }) => imageResolution.sourceImageMissing,
    ).length,
    verifiedImageOverrideCount: normalizedProducts.filter(
      ({ imageResolution }) => imageResolution.usedVerifiedOverride,
    ).length,
    editorialImageFallbackCount: normalizedProducts.filter(
      ({ imageResolution }) => imageResolution.usedEditorialFallback,
    ).length,
    normalizedMissingImageCount: 0,
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
