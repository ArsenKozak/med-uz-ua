import fs from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import {
  productSchema,
  type ProductCategory,
  type ProductContent,
} from "../src/schemas/product.ts";

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, "shop_seed.json");
const OUTPUT_DIR = path.join(ROOT, "src", "content", "products");
const PUBLIC_DIR = path.join(ROOT, "public");
const MANIFEST_PATH = path.join(ROOT, "scripts", "seed-products.manifest.json");

const cli = new Set(process.argv.slice(2));
const CHECK_ONLY = cli.has("--check");
const ALLOW_MISSING_IMAGES = cli.has("--allow-missing-images");

const sourceCategorySchema = z.enum([
  "lenses",
  "frames",
  "sunglasses",
  "care",
]);

const sourceProductSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    category: sourceCategorySchema,
    brand: z.string().trim().min(1),
    price: z.number().int().nonnegative().refine(Number.isSafeInteger),
    inStock: z.boolean(),
    image: z
      .string()
      .startsWith("/images/shop/")
      .regex(/\.(?:jpe?g|png|webp)$/i),
    description: z.string().trim().min(1),
  })
  .strict();

const sourceCatalogSchema = z.array(sourceProductSchema).min(1);

const manifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    ),
  })
  .strict();

type SourceProduct = z.infer<typeof sourceProductSchema>;

interface NormalizedProduct {
  readonly id: string;
  readonly product: ProductContent;
  readonly filename: string;
  readonly imageExists: boolean;
}

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const location = issue.path.length ? issue.path.join(".") : "root";
      return `${location}: ${issue.message}`;
    })
    .join("\n");
}

function readJsonUnknown(filePath: string): unknown {
  let raw: string;

  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(
      `Cannot read ${path.relative(ROOT, filePath)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(
      `${path.relative(ROOT, filePath)} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function readSeed(): readonly SourceProduct[] {
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error(`Missing seed file: ${SEED_PATH}`);
  }

  const result = sourceCatalogSchema.safeParse(readJsonUnknown(SEED_PATH));

  if (!result.success) {
    throw new Error(`shop_seed.json failed validation:\n${formatZodError(result.error)}`);
  }

  return result.data;
}

function canonicalId(sourceId: string): string {
  const id = sourceId
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!id) {
    throw new Error(`Cannot normalize product id: ${JSON.stringify(sourceId)}`);
  }

  return id;
}

function publicFileForUrl(publicUrl: string): string {
  const relative = publicUrl.replace(/^\/+/, "");
  const absolute = path.resolve(PUBLIC_DIR, relative);
  const publicRoot = `${path.resolve(PUBLIC_DIR)}${path.sep}`;

  if (!absolute.startsWith(publicRoot)) {
    throw new Error(`Unsafe public image path: ${publicUrl}`);
  }

  return absolute;
}

function imageExists(publicUrl: string): boolean {
  const file = publicFileForUrl(publicUrl);

  try {
    return fs.statSync(file).isFile() && fs.statSync(file).size > 0;
  } catch {
    return false;
  }
}

function toProduct(source: SourceProduct): NormalizedProduct {
  const id = canonicalId(source.id);
  const priceMinor = source.price * 100;

  if (!Number.isSafeInteger(priceMinor)) {
    throw new Error(`Unsafe price for ${id}: ${source.price}`);
  }

  const exists = imageExists(source.image);

  const parsed = productSchema.safeParse({
    title: source.title,
    description: source.description,
    category: source.category satisfies ProductCategory,
    brand: source.brand,
    priceMinor,
    currency: "UAH",
    image: source.image,
    imageKind: "product",
    inStock: source.inStock,
    status: "active",
    verificationStatus: "verified",
  });

  if (!parsed.success) {
    throw new Error(
      `Normalized product ${id} failed productSchema:\n${formatZodError(parsed.error)}`,
    );
  }

  return {
    id,
    filename: `${id}.json`,
    product: parsed.data,
    imageExists: exists,
  };
}

function readPreviousManifest(): ReadonlySet<string> {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return new Set();
  }

  const result = manifestSchema.safeParse(readJsonUnknown(MANIFEST_PATH));

  if (!result.success) {
    throw new Error(
      `Invalid seed-products.manifest.json:\n${formatZodError(result.error)}`,
    );
  }

  return new Set(result.data.generatedFiles);
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeIfChanged(filePath: string, content: string): "created" | "updated" | "unchanged" {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf8");
    return "created";
  }

  if (fs.readFileSync(filePath, "utf8") === content) {
    return "unchanged";
  }

  fs.writeFileSync(filePath, content, "utf8");
  return "updated";
}

function main(): void {
  const source = readSeed();
  const normalized = source.map(toProduct);

  const byId = new Map<string, NormalizedProduct>();

  for (const item of normalized) {
    const existing = byId.get(item.id);

    if (existing) {
      throw new Error(
        `Duplicate canonical id ${item.id}: ${existing.filename} conflicts with ${item.filename}`,
      );
    }

    byId.set(item.id, item);
  }

  const products = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const missingImages = products.filter((item) => !item.imageExists);

  if (missingImages.length && !ALLOW_MISSING_IMAGES) {
    const lines = missingImages.map(
      ({ id, product }) => `- ${id}: ${product.image}`,
    );

    throw new Error(
      [
        `${missingImages.length} product image(s) are missing.`,
        "Run the image-fetch script first, or intentionally use --allow-missing-images for a non-production seed.",
        ...lines,
      ].join("\n"),
    );
  }

  const expectedFiles = products.map(({ filename }) => filename);
  const expectedSet = new Set(expectedFiles);
  const previousOwned = readPreviousManifest();

  for (const filename of expectedFiles) {
    const filePath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filePath) && !previousOwned.has(filename)) {
      throw new Error(
        `Refusing to overwrite non-seed-owned product file: ${path.relative(ROOT, filePath)}`,
      );
    }
  }

  const categoryCounts: Record<ProductCategory, number> = {
    lenses: 0,
    frames: 0,
    sunglasses: 0,
    care: 0,
  };

  for (const { product } of products) {
    categoryCounts[product.category] += 1;
  }

  if (CHECK_ONLY) {
    console.log(
      JSON.stringify(
        {
          mode: "check",
          sourceRecords: source.length,
          validUniqueProducts: products.length,
          missingImages: missingImages.length,
          categoryCounts,
        },
        null,
        2,
      ),
    );
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let removed = 0;

  for (const { filename, product } of products) {
    const result = writeIfChanged(
      path.join(OUTPUT_DIR, filename),
      serialize(product),
    );

    if (result === "created") created += 1;
    if (result === "updated") updated += 1;
    if (result === "unchanged") unchanged += 1;
  }

  for (const oldFilename of previousOwned) {
    if (expectedSet.has(oldFilename)) continue;

    const oldPath = path.join(OUTPUT_DIR, oldFilename);

    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      removed += 1;
    }
  }

  fs.writeFileSync(
    MANIFEST_PATH,
    serialize({
      version: 1,
      generatedFiles: expectedFiles,
    }),
    "utf8",
  );

  // Re-read generated files through the same canonical schema.
  for (const { filename } of products) {
    const result = productSchema.safeParse(
      readJsonUnknown(path.join(OUTPUT_DIR, filename)),
    );

    if (!result.success) {
      throw new Error(
        `Post-write validation failed for ${filename}:\n${formatZodError(result.error)}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        sourceRecords: source.length,
        validUniqueProducts: products.length,
        generatedProducts: expectedFiles.length,
        created,
        updated,
        unchanged,
        staleGeneratedFilesRemoved: removed,
        missingImages: missingImages.length,
        categoryCounts,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  die(error instanceof Error ? error.message : String(error));
}
