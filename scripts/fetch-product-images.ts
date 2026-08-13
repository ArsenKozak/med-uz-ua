import fs from "node:fs";
import path from "node:path";
import { z } from "astro/zod";

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, "shop_seed.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const REPORT_PATH = path.join(ROOT, "scripts", "product-image-sources.json");

const API_KEY = process.env.SERPAPI_API_KEY;
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");

const sourceProductSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    category: z.enum(["lenses", "frames", "sunglasses", "care"]),
    brand: z.string().trim().min(1),
    price: z.number(),
    inStock: z.boolean(),
    image: z.string().startsWith("/images/shop/").endsWith(".jpg"),
    description: z.string(),
  })
  .strict();

const catalogSchema = z.array(sourceProductSchema).min(1);
type SourceProduct = z.infer<typeof sourceProductSchema>;

const serpImageSchema = z.object({
  original: z.string().url(),
  title: z.string().optional(),
  source: z.string().optional(),
  link: z.string().url().optional(),
  original_width: z.number().int().positive().optional(),
  original_height: z.number().int().positive().optional(),
  is_product: z.boolean().optional(),
});

const serpResponseSchema = z.object({
  images_results: z.array(serpImageSchema).default([]),
});

type SerpImage = z.infer<typeof serpImageSchema>;

interface DownloadRecord {
  readonly id: string;
  readonly query: string;
  readonly localPath: string;
  readonly originalUrl: string;
  readonly sourcePage: string | null;
  readonly sourceDomain: string | null;
}

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

function readSeed(): readonly SourceProduct[] {
  const raw = fs.readFileSync(SEED_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return catalogSchema.parse(parsed);
}

function publicFile(publicUrl: string): string {
  const absolute = path.resolve(PUBLIC_DIR, publicUrl.replace(/^\/+/, ""));
  const root = `${path.resolve(PUBLIC_DIR)}${path.sep}`;

  if (!absolute.startsWith(root)) {
    throw new Error(`Unsafe output path: ${publicUrl}`);
  }

  return absolute;
}

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchQuery(product: SourceProduct): string {
  // Exact model + brand + packshot intent.
  return `${product.brand} ${product.title} product packshot white background`;
}

function scoreCandidate(product: SourceProduct, image: SerpImage): number {
  const productTokens = new Set(
    normalize(`${product.brand} ${product.title}`)
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );

  const candidateText = normalize(
    `${image.title ?? ""} ${image.source ?? ""} ${image.link ?? ""}`,
  );

  let score = 0;

  for (const token of productTokens) {
    if (candidateText.includes(token)) score += 2;
  }

  if (image.is_product) score += 5;

  if (
    (image.original_width ?? 0) >= 600 &&
    (image.original_height ?? 0) >= 600
  ) {
    score += 3;
  }

  if (/amazon|ebay|pinterest|facebook|instagram/i.test(image.source ?? "")) {
    score -= 4;
  }

  return score;
}

async function searchImages(product: SourceProduct): Promise<readonly SerpImage[]> {
  if (!API_KEY) {
    throw new Error(
      "SERPAPI_API_KEY is missing. Set it in the environment before running this script.",
    );
  }

  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", searchQuery(product));
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("output", "json");
  url.searchParams.set("safe", "active");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Image search failed for ${product.id}: HTTP ${response.status}`,
    );
  }

  const parsed = serpResponseSchema.parse((await response.json()) as unknown);

  return [...parsed.images_results].sort(
    (a, b) => scoreCandidate(product, b) - scoreCandidate(product, a),
  );
}

async function downloadJpeg(
  candidates: readonly SerpImage[],
  destination: string,
): Promise<SerpImage> {
  let lastFailure = "No candidates.";

  for (const candidate of candidates.slice(0, 20)) {
    try {
      const response = await fetch(candidate.original, {
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: {
          accept: "image/jpeg,image/*;q=0.8",
          "user-agent":
            "Mozilla/5.0 (compatible; MedUzProductAssetFetcher/1.0)",
        },
      });

      if (!response.ok) {
        lastFailure = `HTTP ${response.status} from ${candidate.original}`;
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";

      // Every target in the current shop_seed.json is .jpg.
      // Never save PNG/WebP bytes with a fake .jpg extension.
      if (!/^image\/jpe?g(?:;|$)/i.test(contentType)) {
        lastFailure = `Not JPEG (${contentType}): ${candidate.original}`;
        continue;
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > 15 * 1024 * 1024) {
        lastFailure = `Image too large: ${candidate.original}`;
        continue;
      }

      const bytes = Buffer.from(await response.arrayBuffer());

      if (
        bytes.length < 3 ||
        bytes[0] !== 0xff ||
        bytes[1] !== 0xd8 ||
        bytes[2] !== 0xff
      ) {
        lastFailure = `Invalid JPEG bytes: ${candidate.original}`;
        continue;
      }

      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, bytes);

      return candidate;
    } catch (error) {
      lastFailure =
        error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`No downloadable JPEG candidate. Last failure: ${lastFailure}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const products = readSeed();
  const downloaded: DownloadRecord[] = [];
  const skipped: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const [index, product] of products.entries()) {
    const destination = publicFile(product.image);

    if (!FORCE && fs.existsSync(destination) && fs.statSync(destination).size > 0) {
      skipped.push(product.id);
      console.log(`[${index + 1}/${products.length}] skip ${product.id}`);
      continue;
    }

    const query = searchQuery(product);
    console.log(`[${index + 1}/${products.length}] search ${product.id}: ${query}`);

    if (DRY_RUN) {
      continue;
    }

    try {
      const candidates = await searchImages(product);
      const selected = await downloadJpeg(candidates, destination);

      downloaded.push({
        id: product.id,
        query,
        localPath: product.image,
        originalUrl: selected.original,
        sourcePage: selected.link ?? null,
        sourceDomain: selected.source ?? null,
      });

      console.log(`  -> ${product.image}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failed.push({ id: product.id, reason });
      console.error(`  !! ${reason}`);
    }

    // Be polite to the search provider and origin servers.
    await sleep(350);
  }

  if (!DRY_RUN) {
    fs.writeFileSync(
      REPORT_PATH,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          downloaded,
          skipped,
          failed,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  }

  console.log(
    JSON.stringify(
      {
        products: products.length,
        downloaded: downloaded.length,
        skipped: skipped.length,
        failed: failed.length,
        report: path.relative(ROOT, REPORT_PATH),
      },
      null,
      2,
    ),
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  die(error instanceof Error ? error.message : String(error));
});
