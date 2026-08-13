import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import { productSchema } from "../src/schemas/product.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SEED_FILE = path.join(PROJECT_ROOT, "shop_seed.json");
const CONTENT_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const SHOP_IMAGE_DIR = path.join(PUBLIC_DIR, "images", "shop");
const PROVENANCE_FILE = path.join(SHOP_IMAGE_DIR, "image-sources.tsv");
const MANIFEST_FILE = path.join(SCRIPT_DIR, "seed-products.manifest.json");
const REPORT_JSON = path.join(PROJECT_ROOT, "docs", "product-image-coverage.json");
const REPORT_MARKDOWN = path.join(PROJECT_ROOT, "docs", "product-image-coverage.md");
const EXPECTED_SEED_COUNT = 60;

interface VisualReview {
  readonly assessment: string;
  readonly note: string;
}

// Human review of the actual bytes in this repository. These observations identify
// what is visibly present; they do not grant usage rights or prove local inventory.
const VISUAL_REVIEW_BY_PUBLIC_PATH = {
  "/images/shop/care/care-solution-01.jpg": {
    assessment: "model-family-volume-unverified",
    note: "Biotrue solution packaging is visible; the seed's exact 300 ml variant is not legible.",
  },
  "/images/shop/care/care-solution-02.jpg": {
    assessment: "different-product",
    note: "The image shows Multison, which is not an intended seed product.",
  },
  "/images/shop/care/care-solution-03.jpg": {
    assessment: "pack-volume-mismatch",
    note: "ReNu MultiPlus packaging is visible, but the pictured small pack does not support the 360 ml seed claim.",
  },
  "/images/shop/frames/frames-catalog-01.jpeg": {
    assessment: "generic-unbranded-frame",
    note: "One unbranded frame is shown outdoors; no seeded model or SKU can be identified.",
  },
  "/images/shop/frames/frames-catalog-02.webp": {
    assessment: "not-a-product-photo",
    note: "The image is a clinic/interior scene, not a frame product.",
  },
  "/images/shop/frames/frames-showcase-01.jpg": {
    assessment: "category-display-only",
    note: "A multi-frame display is shown; no single seeded model can be bound.",
  },
  "/images/shop/lenses/lens-product-01.jpg": {
    assessment: "different-product",
    note: "The image shows CooperVision MyDay daily disposable.",
  },
  "/images/shop/lenses/lens-product-02.jpg": {
    assessment: "different-product",
    note: "The image shows Bausch + Lomb Optima FW.",
  },
  "/images/shop/lenses/lens-product-03.jpg": {
    assessment: "model-family-match-pack-unverified",
    note: "Dailies Total1 packaging is visible; exact pack count is not established by the image.",
  },
  "/images/shop/lenses/lens-product-04.jpg": {
    assessment: "different-variant",
    note: "The image shows Biofinity multifocal, not plain Biofinity.",
  },
  "/images/shop/lenses/lens-product-05.jpg": {
    assessment: "different-variant",
    note: "The image shows Biofinity toric, not plain Biofinity.",
  },
  "/images/shop/lenses/lens-product-06.jpg": {
    assessment: "different-product",
    note: "The image shows Bausch + Lomb SofLens Multi-Focal.",
  },
  "/images/shop/lenses/lens-product-07.jpg": {
    assessment: "different-category-product",
    note: "The image shows Opti-Free Express lens solution, not contact lenses.",
  },
  "/images/shop/lenses/lens-product-08.jpg": {
    assessment: "different-variant",
    note: "The image shows Air Optix plus HydraGlyde for Astigmatism.",
  },
  "/images/shop/lenses/lens-product-09.jpg": {
    assessment: "different-variant",
    note: "The image shows Air Optix plus HydraGlyde Multifocal.",
  },
  "/images/shop/lenses/lens-product-10.jpg": {
    assessment: "different-product",
    note: "The image shows Dailies AquaComfort Plus.",
  },
  "/images/shop/lenses/lens-product-11.jpg": {
    assessment: "model-family-match-pack-unverified",
    note: "Plain Biofinity packaging is visible; pack count is not established.",
  },
  "/images/shop/lenses/lens-product-12.jpg": {
    assessment: "different-product",
    note: "The image shows SofLens Natural Colors.",
  },
  "/images/shop/lenses/lens-product-13.jpg": {
    assessment: "different-product",
    note: "The image shows Air Optix Colors.",
  },
  "/images/shop/lenses/lens-product-14.jpg": {
    assessment: "different-product",
    note: "The image shows SofLens 59.",
  },
  "/images/shop/lenses/lens-product-15.jpg": {
    assessment: "different-category-product",
    note: "The image shows AOSept lens-care solution, not contact lenses.",
  },
  "/images/shop/lenses/lens-product-16.jpg": {
    assessment: "different-category-product",
    note: "The image shows Avizor Unica lens-care solution.",
  },
  "/images/shop/lenses/lens-product-17.jpg": {
    assessment: "different-category-product",
    note: "The image shows an Avizor lens-care system, not contact lenses.",
  },
  "/images/shop/lenses/lens-product-18.jpg": {
    assessment: "different-category-product",
    note: "The image shows Avizor Aqua Soft lens-care solution.",
  },
  "/images/shop/lenses/lens-product-19.jpg": {
    assessment: "model-family-match-pack-unverified",
    note: "Air Optix Night & Day Aqua packaging is visible; pack count is not established.",
  },
  "/images/shop/lenses/lens-product-20.jpg": {
    assessment: "model-family-match-pack-unverified",
    note: "Air Optix plus HydraGlyde packaging is visible; pack count is not established.",
  },
  "/images/shop/lenses/lens-product-21.jpg": {
    assessment: "different-product",
    note: "The image shows ClearLux Premium.",
  },
  "/images/shop/lenses/lens-product-22.jpg": {
    assessment: "model-family-match-pack-unverified",
    note: "Bausch + Lomb ULTRA packaging is visible; the required pack count is not established.",
  },
  "/images/shop/sunglasses/sunglass-oakley-sport-03.jpg": {
    assessment: "invalid-raster",
    note: "The .jpg file contains HTML bytes.",
  },
  "/images/shop/sunglasses/sunglass-polaroid-classic-02.jpg": {
    assessment: "generic-unbranded-lifestyle",
    note: "Lifestyle sunglasses photo with no visible Polaroid model/SKU evidence.",
  },
  "/images/shop/sunglasses/sunglass-rayban-aviator-01.jpg": {
    assessment: "generic-unbranded-different-shape",
    note: "Round unbranded sunglasses are shown, not a verified Ray-Ban Aviator model.",
  },
  "/images/shop/sunglasses/sunglass-tomford-luxury-05.jpg": {
    assessment: "invalid-raster",
    note: "The .jpg file contains HTML bytes.",
  },
  "/images/shop/sunglasses/sunglass-vogue-fashion-04.jpg": {
    assessment: "brand-filename-mismatch",
    note: "A Ray-Ban-marked frame is visible under a Vogue filename; no exact seeded model match exists.",
  },
  "/images/shop/care/care-avizor-unica-8.png": {
    assessment: "model-identified-non-packshot",
    note: "Unica Sensitive promotional artwork is visible, but not the exact 350 ml product pack.",
  },
  "/images/shop/care/care-biotrue-solution-1.jpg": {
    assessment: "model-family-volume-unverified",
    note: "Biotrue solution bottle is visible; 300 ml is not legible.",
  },
  "/images/shop/care/care-blink-contacts-7.png": {
    assessment: "brand-attribution-and-pack-need-review",
    note: "The current official source is Bausch + Lomb while the seed attributes Johnson & Johnson; the rear pack also does not establish the exact 10 ml item.",
  },
  "/images/shop/care/care-opti-free-puremoist-2.webp": {
    assessment: "not-a-product-photo",
    note: "The asset is a product comparison table, not a PureMoist 360 ml packshot.",
  },
  "/images/shop/care/care-systane-balance-11.webp": {
    assessment: "exact-model-volume",
    note: "Systane Balance 10 ml box and bottle are visibly identified.",
  },
  "/images/shop/care/care-systane-ultra-drops-3.jpg": {
    assessment: "exact-model-volume",
    note: "Systane Ultra 10 ml box and bottle are visibly identified.",
  },
  "/images/shop/lenses/lens-acuvue-moist-7.webp": {
    assessment: "pack-count-mismatch",
    note: "The acquired ACUVUE asset identifies a 90-pack while the seed requests 30.",
  },
  "/images/shop/lenses/lens-acuvue-oasys-3.webp": {
    assessment: "pack-count-mismatch",
    note: "The acquired ACUVUE asset identifies a 24-pack while the seed requests 6.",
  },
  "/images/shop/lenses/lens-air-optix-night-day-1.webp": {
    assessment: "model-family-match-pack-unverified",
    note: "Air Optix Night & Day Aqua packaging is visible; the seed's 3-pack count is not visible.",
  },
  "/images/shop/lenses/lens-air-optix-plus-8.png": {
    assessment: "model-family-match-pack-unverified",
    note: "Air Optix plus HydraGlyde packaging is visible; the seed's 3-pack count is not visible.",
  },
  "/images/shop/lenses/lens-biofinity-2.png": {
    assessment: "variant-composite",
    note: "The asset combines Biofinity and Biofinity XR packaging, so it is not one exact seed packshot.",
  },
  "/images/shop/lenses/lens-biotrue-oneday-14.png": {
    assessment: "model-family-match-pack-unverified",
    note: "Biotrue ONEday packaging is visible; the seed's 30-pack count is not established.",
  },
  "/images/shop/lenses/lens-clariti-1day-6.webp": {
    assessment: "not-a-product-photo",
    note: "The asset is a lifestyle banner, not a Clariti 1 Day 30-pack product photo.",
  },
  "/images/shop/lenses/lens-menicon-z-11.jpg": {
    assessment: "not-a-product-photo",
    note: "The asset is a lifestyle group photo, not a Menicon Z product photo.",
  },
  "/images/shop/lenses/lens-purevision-2-10.webp": {
    assessment: "model-pack-match-hd-marking-unverified",
    note: "PureVision2 six-lens packaging is visible, but the seed's HD wording is not visible.",
  },
  "/images/shop/lenses/lens-seed-1day-pure-12.jpg": {
    assessment: "pack-count-mismatch",
    note: "The image visibly identifies 32 lenses while the seed requests 30.",
  },
  "/images/shop/lenses/lens-ultra-bausch-lomb-5.webp": {
    assessment: "pack-count-mismatch",
    note: "The image visibly identifies 6 lenses while the seed requests 3.",
  },
} as const satisfies Readonly<Record<string, VisualReview>>;

function visualReviewFor(publicPath: string): VisualReview | undefined {
  return (VISUAL_REVIEW_BY_PUBLIC_PATH as Readonly<Record<string, VisualReview>>)[
    publicPath
  ];
}

const seedProductSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1),
    category: z.enum(["lenses", "frames", "sunglasses", "care"]),
    brand: z.string().trim().min(1),
    price: z.number().int().positive().refine(Number.isSafeInteger),
    inStock: z.boolean(),
    image: z.string().startsWith("/images/shop/"),
    description: z.string().trim().min(1),
  })
  .strict();
const seedSchema = z.array(seedProductSchema).length(EXPECTED_SEED_COUNT);
const generatedManifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    ),
  })
  .strict();

type ProductData = z.infer<typeof productSchema>;
type SeedProduct = z.infer<typeof seedProductSchema>;
type ProvenanceRow = Readonly<Record<string, string>>;

interface CoverageRow {
  readonly slugSku: string;
  readonly recordKind: "generated-seed" | "manual-draft-placeholder" | "manual-other";
  readonly brandModel: string;
  readonly category: ProductData["category"];
  readonly referencedPath: string;
  readonly fileExists: boolean;
  readonly rasterMagicValid: boolean;
  readonly detectedMime: string | null;
  readonly imageKind: ProductData["imageKind"];
  readonly sourceUrl: string | null;
  readonly sourceAssetUrl: string | null;
  readonly provider: string | null;
  readonly exactMatchConfidence: string;
  readonly usageRights: string;
  readonly duplicateUseCount: number;
  readonly status:
    | "exact-product-evidence-approved"
    | "verified-category-fallback"
    | "product-image-evidence-gap"
    | "missing-referenced-file"
    | "invalid-referenced-file";
  readonly seedRequestedPath: string | null;
  readonly seedRequestedFileExists: boolean | null;
  readonly candidateSourceUrl: string | null;
  readonly candidateProvider: string | null;
  readonly candidateUsageRights: string | null;
  readonly candidateExactMatchConfidence: string | null;
  readonly candidateVisualAssessment: string | null;
  readonly candidateVisualNote: string | null;
}

interface ShopAssetRow {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly detectedMime: string | null;
  readonly rasterMagicValid: boolean;
  readonly provenanceRecorded: boolean;
  readonly referencedByProducts: number;
  readonly visualAssessment: string;
  readonly visualNote: string;
  readonly status:
    | "referenced"
    | "unreferenced-provenance-recorded"
    | "unreferenced-unknown-provenance"
    | "invalid-raster";
}

function fail(message: string): never {
  throw new Error(message);
}

function parseJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    fail(
      `${path.relative(PROJECT_ROOT, filePath)} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function parseTsv(filePath: string): readonly ProvenanceRow[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const headers = (lines[0] ?? "").split("\t");
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    return Object.freeze(
      Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
    );
  });
}

function resolvePublicPath(publicUrl: string): string | null {
  if (!publicUrl.startsWith("/images/") || publicUrl.includes("\\")) return null;
  const absolute = path.resolve(PUBLIC_DIR, publicUrl.slice(1));
  const root = `${path.resolve(PUBLIC_DIR)}${path.sep}`;
  return absolute.startsWith(root) ? absolute : null;
}

function detectRasterMime(filePath: string): string | null {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 512) return null;
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
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
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(bytes.toString("ascii", 8, 12))
  ) {
    return "image/avif";
  }
  return null;
}

function sha256(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function publicUrlForProvenance(row: ProvenanceRow): string | null {
  const category = row.category ?? "";
  const filename = row.file ?? "";
  if (
    !["lenses", "frames", "sunglasses", "care"].includes(category) ||
    filename.length === 0 ||
    path.basename(filename) !== filename
  ) {
    return null;
  }
  return `/images/shop/${category}/${filename}`;
}

function provenanceApprovesExactBytes(
  row: ProvenanceRow | undefined,
  referencedFile: string,
): boolean {
  if (
    row === undefined ||
    row.usage_rights !== "approved-for-site" ||
    row.exact_match_confidence !== "exact" ||
    !/^https:\/\//.test(row.source_page ?? "") ||
    !/^https:\/\//.test(row.source_asset ?? "") ||
    !/^[a-f0-9]{64}$/.test(row.sha256 ?? "") ||
    !fs.existsSync(referencedFile)
  ) {
    return false;
  }
  return sha256(referencedFile) === row.sha256;
}

function walkFiles(root: string): readonly string[] {
  if (!fs.existsSync(root)) return [];
  const result: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else if (entry.isFile()) result.push(entryPath);
    }
  };
  visit(root);
  return result.sort();
}

function escapeMarkdown(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function markdownLink(url: string | null, label: string): string {
  if (url === null || !/^https:\/\//.test(url)) return "—";
  return `[${escapeMarkdown(label)}](${url})`;
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

function buildReport(): {
  readonly json: Readonly<Record<string, unknown>>;
  readonly markdown: string;
} {
  if (process.argv.slice(2).length > 0) {
    fail("This coverage generator accepts no flags.");
  }

  const seedResult = seedSchema.safeParse(parseJson(SEED_FILE));
  if (!seedResult.success) {
    fail(`shop_seed.json failed coverage validation: ${seedResult.error.message}`);
  }
  const seed = seedResult.data;
  const seedById = new Map<string, SeedProduct>();
  for (const product of seed) {
    if (seedById.has(product.id)) fail(`Duplicate seed ID: ${product.id}`);
    seedById.set(product.id, product);
  }

  const manifestResult = generatedManifestSchema.safeParse(parseJson(MANIFEST_FILE));
  if (!manifestResult.success) {
    fail(`seed-products.manifest.json is invalid: ${manifestResult.error.message}`);
  }
  const generatedFiles = new Set(manifestResult.data.generatedFiles);
  const expectedGeneratedFiles = new Set(seed.map(({ id }) => `${id}.json`));
  if (
    generatedFiles.size !== EXPECTED_SEED_COUNT ||
    [...expectedGeneratedFiles].some((filename) => !generatedFiles.has(filename)) ||
    [...generatedFiles].some((filename) => !expectedGeneratedFiles.has(filename))
  ) {
    fail("Generated manifest does not exactly match the 60 intended seed IDs.");
  }

  const provenance = parseTsv(PROVENANCE_FILE);
  const provenanceByProduct = new Map<string, ProvenanceRow[]>();
  const provenanceByPath = new Map<string, ProvenanceRow[]>();
  for (const row of provenance) {
    const productId = row.product_id ?? "";
    if (productId) {
      const items = provenanceByProduct.get(productId) ?? [];
      items.push(row);
      provenanceByProduct.set(productId, items);
    }
    const publicUrl = publicUrlForProvenance(row);
    if (publicUrl !== null) {
      const items = provenanceByPath.get(publicUrl) ?? [];
      items.push(row);
      provenanceByPath.set(publicUrl, items);
    }
  }

  const productFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const parsedProducts: Array<{
    readonly filename: string;
    readonly slug: string;
    readonly data: ProductData;
  }> = [];
  for (const filename of productFiles) {
    const result = productSchema.safeParse(parseJson(path.join(CONTENT_DIR, filename)));
    if (!result.success) {
      fail(`${filename} failed productSchema: ${result.error.message}`);
    }
    parsedProducts.push({
      filename,
      slug: filename.slice(0, -".json".length),
      data: result.data,
    });
  }

  const imageUseCounts = new Map<string, number>();
  for (const { data } of parsedProducts) {
    imageUseCounts.set(data.image, (imageUseCounts.get(data.image) ?? 0) + 1);
  }

  const coverageRows: CoverageRow[] = parsedProducts.map(
    ({ filename, slug, data }): CoverageRow => {
      const seedProduct = seedById.get(slug);
      const isGenerated = generatedFiles.has(filename);
      const recordKind: CoverageRow["recordKind"] = isGenerated
        ? "generated-seed"
        : data.status === "draft" &&
            data.verificationStatus === "pending-clinic-confirmation"
          ? "manual-draft-placeholder"
          : "manual-other";
      const referencedFile = resolvePublicPath(data.image);
      const fileExists =
        referencedFile !== null &&
        fs.existsSync(referencedFile) &&
        fs.statSync(referencedFile).isFile();
      const detectedMime =
        referencedFile !== null && fileExists
          ? detectRasterMime(referencedFile)
          : null;
      const rasterMagicValid = detectedMime !== null;
      const sourceEvidence = provenanceByPath.get(data.image)?.[0];
      const candidateEvidence = provenanceByProduct.get(slug)?.[0];
      const candidatePath =
        candidateEvidence === undefined
          ? null
          : publicUrlForProvenance(candidateEvidence);
      const candidateVisualReview =
        candidatePath === null
          ? undefined
          : visualReviewFor(candidatePath);
      const exactApproved =
        data.imageKind === "product" &&
        referencedFile !== null &&
        provenanceApprovesExactBytes(sourceEvidence, referencedFile);

      let status: CoverageRow["status"];
      if (!fileExists) status = "missing-referenced-file";
      else if (!rasterMagicValid) status = "invalid-referenced-file";
      else if (data.imageKind === "editorial") status = "verified-category-fallback";
      else if (exactApproved) status = "exact-product-evidence-approved";
      else status = "product-image-evidence-gap";

      const requestedFile = seedProduct
        ? resolvePublicPath(seedProduct.image)
        : null;

      return Object.freeze({
        slugSku: slug,
        recordKind,
        brandModel: `${data.brand} — ${data.title}`,
        category: data.category,
        referencedPath: data.image,
        fileExists,
        rasterMagicValid,
        detectedMime,
        imageKind: data.imageKind,
        sourceUrl: sourceEvidence?.source_page || null,
        sourceAssetUrl: sourceEvidence?.source_asset || null,
        provider: sourceEvidence?.provider || null,
        exactMatchConfidence:
          data.imageKind === "editorial"
            ? "not-applicable-editorial"
            : sourceEvidence?.exact_match_confidence || "unverified",
        usageRights:
          data.imageKind === "editorial"
            ? "local-editorial-asset"
            : sourceEvidence?.usage_rights || "unknown",
        duplicateUseCount: imageUseCounts.get(data.image) ?? 0,
        status,
        seedRequestedPath: seedProduct?.image ?? null,
        seedRequestedFileExists:
          seedProduct === undefined
            ? null
            : requestedFile !== null && detectRasterMime(requestedFile) !== null,
        candidateSourceUrl: candidateEvidence?.source_page || null,
        candidateProvider: candidateEvidence?.provider || null,
        candidateUsageRights: candidateEvidence?.usage_rights || null,
        candidateExactMatchConfidence:
          candidateEvidence?.exact_match_confidence || null,
        candidateVisualAssessment:
          candidateVisualReview?.assessment ?? null,
        candidateVisualNote: candidateVisualReview?.note ?? null,
      });
    },
  );

  const referencedPaths = new Set(coverageRows.map(({ referencedPath }) => referencedPath));
  const shopAssets: ShopAssetRow[] = walkFiles(SHOP_IMAGE_DIR)
    .filter((filePath) => /\.(?:jpe?g|png|webp|avif|gif)$/i.test(filePath))
    .map((filePath): ShopAssetRow => {
      const publicUrl = `/${path.relative(PUBLIC_DIR, filePath).split(path.sep).join("/")}`;
      const detectedMime = detectRasterMime(filePath);
      const rasterMagicValid = detectedMime !== null;
      const provenanceRecorded = provenanceByPath.has(publicUrl);
      const visualReview = visualReviewFor(publicUrl);
      const referencedByProducts = coverageRows.filter(
        ({ referencedPath }) => referencedPath === publicUrl,
      ).length;
      let status: ShopAssetRow["status"];
      if (!rasterMagicValid) status = "invalid-raster";
      else if (referencedPaths.has(publicUrl)) status = "referenced";
      else if (provenanceRecorded) status = "unreferenced-provenance-recorded";
      else status = "unreferenced-unknown-provenance";
      return Object.freeze({
        path: publicUrl,
        bytes: fs.statSync(filePath).size,
        sha256: sha256(filePath),
        detectedMime,
        rasterMagicValid,
        provenanceRecorded,
        referencedByProducts,
        visualAssessment:
          visualReview?.assessment ?? "not-individually-reviewed",
        visualNote:
          visualReview?.note ??
          "No product-specific visual conclusion is recorded for this asset.",
        status,
      });
    });

  const summary = Object.freeze({
    expectedSeedRecords: EXPECTED_SEED_COUNT,
    seedRecords: seed.length,
    uniqueSeedIds: seedById.size,
    generatedManifestFiles: generatedFiles.size,
    productCollectionFiles: coverageRows.length,
    generatedSeedProducts: coverageRows.filter(
      ({ recordKind }) => recordKind === "generated-seed",
    ).length,
    manualDraftPlaceholders: coverageRows.filter(
      ({ recordKind }) => recordKind === "manual-draft-placeholder",
    ).length,
    manualOtherProducts: coverageRows.filter(
      ({ recordKind }) => recordKind === "manual-other",
    ).length,
    zodValidProductFiles: coverageRows.length,
    exactProductImagesApproved: coverageRows.filter(
      ({ status }) => status === "exact-product-evidence-approved",
    ).length,
    honestEditorialFallbacks: coverageRows.filter(
      ({ status }) => status === "verified-category-fallback",
    ).length,
    productImageEvidenceGaps: coverageRows.filter(
      ({ status }) => status === "product-image-evidence-gap",
    ).length,
    productsWithoutApprovedExactPhoto: coverageRows.filter(
      ({ status }) => status !== "exact-product-evidence-approved",
    ).length,
    missingReferencedFiles: coverageRows.filter(
      ({ status }) => status === "missing-referenced-file",
    ).length,
    invalidReferencedFiles: coverageRows.filter(
      ({ status }) => status === "invalid-referenced-file",
    ).length,
    provenanceRows: provenance.length,
    approvedForSiteProvenanceRows: provenance.filter(
      (row) => row.usage_rights === "approved-for-site",
    ).length,
    permissionUnverifiedProvenanceRows: provenance.filter(
      (row) => row.usage_rights === "permission-unverified",
    ).length,
    visuallyExactCandidateRows: provenance.filter(
      (row) => row.exact_match_confidence === "exact",
    ).length,
    partialVisualCandidateRows: provenance.filter(
      (row) => row.exact_match_confidence === "partial",
    ).length,
    mismatchedVisualCandidateRows: provenance.filter(
      (row) => row.exact_match_confidence === "mismatch",
    ).length,
    shopRasterFilenameCount: shopAssets.length,
    invalidShopRasterFiles: shopAssets.filter(
      ({ status }) => status === "invalid-raster",
    ).length,
    unreferencedShopAssets: shopAssets.filter(
      ({ referencedByProducts }) => referencedByProducts === 0,
    ).length,
  });

  const json = Object.freeze({
    version: 1,
    notes: Object.freeze([
      "slugSku uses the product content slug because the current schema has no distinct SKU field.",
      "A downloaded manufacturer asset is not bound as an exact product image unless provenance records exact visual review, byte hash, and approved-for-site usage rights.",
      "Editorial category fallbacks are intentionally non-exact and remain visible as such through imageKind=editorial.",
      "visualAssessment records a human inspection of repository bytes and is independent from copyright or usage approval.",
    ]),
    summary,
    products: coverageRows,
    shopAssets,
  });

  const summaryRows = Object.entries(summary)
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join("\n");
  const coverageTable = coverageRows
    .map((row) => {
      const source = row.sourceUrl
        ? markdownLink(row.sourceUrl, row.provider ?? "source")
        : row.candidateSourceUrl
          ? `${markdownLink(row.candidateSourceUrl, row.candidateProvider ?? "candidate")} (candidate only)`
          : "—";
      const confidence = row.candidateVisualAssessment
        ? `${row.exactMatchConfidence}; candidate: ${row.candidateExactMatchConfidence ?? "unverified"}/${row.candidateVisualAssessment}`
        : row.exactMatchConfidence;
      return `| ${escapeMarkdown(row.slugSku)} | ${escapeMarkdown(row.brandModel)} | \`${escapeMarkdown(row.referencedPath)}\` | ${row.fileExists && row.rasterMagicValid ? "yes" : "no"} | ${source} | ${escapeMarkdown(confidence)} | ${row.duplicateUseCount} | ${escapeMarkdown(row.status)} |`;
    })
    .join("\n");
  const invalidAssets = shopAssets.filter(({ rasterMagicValid }) => !rasterMagicValid);
  const invalidAssetSection =
    invalidAssets.length === 0
      ? "No raster-filename files with invalid magic bytes were found."
      : [
          "| Path | Bytes | Status |",
          "|---|---:|---|",
          ...invalidAssets.map(
            (asset) =>
              `| \`${escapeMarkdown(asset.path)}\` | ${asset.bytes} | ${asset.status} |`,
          ),
        ].join("\n");

  const visualReviewRows = shopAssets
    .filter(({ visualAssessment }) => visualAssessment !== "not-individually-reviewed")
    .map(
      (asset) =>
        `| \`${escapeMarkdown(asset.path)}\` | ${escapeMarkdown(asset.visualAssessment)} | ${escapeMarkdown(asset.visualNote)} |`,
    )
    .join("\n");

  const markdown = `# Product image coverage\n\nThis report is generated from \`shop_seed.json\`, the product collection, \`seed-products.manifest.json\`, image magic bytes, and \`public/images/shop/image-sources.tsv\`. It does not grant copyright permission or infer an exact model from a filename.\n\nThe repository has no distinct SKU field, so **slug/SKU** below is the canonical content slug/seed ID. A manufacturer candidate link is labeled “candidate only” when it is not the provenance of the rendered fallback.\n\n## Summary\n\n| Metric | Count |\n|---|---:|\n${summaryRows}\n\nThe three non-manifest collection records are retained because they are explicit \`draft\` / \`pending-clinic-confirmation\` editorial placeholders, not accidental duplicates of the 60 generated seed IDs. Exact one-to-one photo coverage remains blocked until an asset has a visually reviewed model match and documented \`approved-for-site\` usage rights.\n\n## Per-product coverage\n\n| Slug / seed ID | Brand / model | Referenced path | Valid file | Referenced source / acquisition candidate | Exact confidence | Duplicate use | Status |\n|---|---|---|---|---|---|---:|---|\n${coverageTable}\n\n## Visual review of generic and acquired shop assets\n\n| Asset | Assessment | Visible evidence |\n|---|---|---|\n${visualReviewRows}\n\n## Invalid legacy shop assets\n\nThese files are not referenced by any generated product. They are reported rather than silently treated as images.\n\n${invalidAssetSection}\n`;

  const brokenRows = coverageRows.filter(
    ({ status }) =>
      status === "missing-referenced-file" ||
      status === "invalid-referenced-file" ||
      status === "product-image-evidence-gap",
  );
  if (brokenRows.length > 0) {
    fail(
      `${brokenRows.length} product record(s) have a broken or misleading rendered image binding.`,
    );
  }

  return { json, markdown };
}

try {
  const report = buildReport();
  const jsonChanged = writeAtomicIfChanged(
    REPORT_JSON,
    `${JSON.stringify(report.json, null, 2)}\n`,
  );
  const markdownChanged = writeAtomicIfChanged(REPORT_MARKDOWN, report.markdown);
  const summary = report.json.summary as Readonly<Record<string, unknown>>;
  console.log(
    JSON.stringify(
      {
        jsonReport: path.relative(PROJECT_ROOT, REPORT_JSON),
        markdownReport: path.relative(PROJECT_ROOT, REPORT_MARKDOWN),
        jsonChanged,
        markdownChanged,
        summary,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
