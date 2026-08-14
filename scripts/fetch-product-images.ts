import { createHash, randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const SEED_PATH = path.join(PROJECT_ROOT, "shop_seed.json");
const SOURCE_MANIFEST_PATH = path.join(
  SCRIPT_DIR,
  "product-image-sources.json",
);
const FAILURE_REPORT_PATH = path.join(
  PUBLIC_DIR,
  "images",
  "shop",
  "image-download-failures.tsv",
);
const EXPECTED_PRODUCT_COUNT = 60;
const MAX_BYTES = 15 * 1024 * 1024;
const MIN_BYTES = 512;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 3;
const MAX_ATTEMPTS = 3;
let networkRequestsStarted = 0;

const mimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
type AllowedMime = z.infer<typeof mimeSchema>;

const sourceEntrySchema = z
  .object({
    productId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: z.string().regex(/^MED-INTERNAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    brand: z.string().trim().min(1),
    model: z.string().trim().min(1),
    sourcePageUrl: z.string(),
    directImageUrl: z.string(),
    expectedFile: z
      .string()
      .regex(
        /^\/images\/shop\/(?:lenses|care|frames|sunglasses)\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/,
      ),
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
type SourceManifest = z.infer<typeof sourceManifestSchema>;

const seedIdentitySchema = z
  .array(
    z
      .object({
        id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        sku: z.string().regex(/^MED-INTERNAL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
        brand: z.string().trim().min(1),
        title: z.string().trim().min(1),
      })
      .passthrough(),
  )
  .length(EXPECTED_PRODUCT_COUNT);

interface RasterInspection {
  readonly mime: AllowedMime;
  readonly sha256: string;
  readonly bytes: number;
}

interface FailureRow {
  readonly productId: string;
  readonly expectedFile: string;
  readonly reason: string;
}

function parseJsonUnknown(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    const parsed: unknown = JSON.parse(raw);
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

function readManifest(): SourceManifest {
  const parsed = sourceManifestSchema.safeParse(
    parseJsonUnknown(SOURCE_MANIFEST_PATH),
  );
  if (!parsed.success) {
    throw new Error(`Invalid product image source manifest:\n${formatZodError(parsed.error)}`);
  }

  const productIds = new Set<string>();
  const slugs = new Set<string>();
  const skus = new Set<string>();
  const outputFiles = new Set<string>();
  for (const entry of parsed.data.products) {
    if (productIds.has(entry.productId)) {
      throw new Error(`Duplicate productId in source manifest: ${entry.productId}`);
    }
    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate slug in source manifest: ${entry.slug}`);
    }
    if (skus.has(entry.sku)) {
      throw new Error(`Duplicate internal SKU in source manifest: ${entry.sku}`);
    }
    if (outputFiles.has(entry.expectedFile)) {
      throw new Error(`Duplicate expectedFile in source manifest: ${entry.expectedFile}`);
    }
    if (entry.productId !== entry.slug) {
      throw new Error(`productId/slug mismatch for ${entry.productId}`);
    }
    const expectedExtension = extensionForMime(entry.expectedMime);
    if (!entry.expectedFile.endsWith(`/${entry.slug}.${expectedExtension}`)) {
      throw new Error(
        `expectedFile must use the product slug and ${expectedExtension} extension for ${entry.productId}`,
      );
    }
    productIds.add(entry.productId);
    slugs.add(entry.slug);
    skus.add(entry.sku);
    outputFiles.add(entry.expectedFile);
  }

  const seedResult = seedIdentitySchema.safeParse(parseJsonUnknown(SEED_PATH));
  if (!seedResult.success) {
    throw new Error(`Invalid canonical seed identity fields:\n${formatZodError(seedResult.error)}`);
  }
  const seedById = new Map(seedResult.data.map((product) => [product.id, product]));
  if (seedById.size !== EXPECTED_PRODUCT_COUNT) {
    throw new Error("Canonical seed contains duplicate IDs.");
  }
  if (new Set(seedResult.data.map((product) => product.slug)).size !== EXPECTED_PRODUCT_COUNT) {
    throw new Error("Canonical seed contains duplicate slugs.");
  }
  if (new Set(seedResult.data.map((product) => product.sku)).size !== EXPECTED_PRODUCT_COUNT) {
    throw new Error("Canonical seed contains duplicate internal SKUs.");
  }
  for (const entry of parsed.data.products) {
    const product = seedById.get(entry.productId);
    if (
      product === undefined ||
      product.slug !== entry.slug ||
      product.sku !== entry.sku ||
      product.brand !== entry.brand ||
      product.title !== entry.model
    ) {
      throw new Error(`Source/seed identity mismatch for ${entry.productId}.`);
    }
  }

  return parsed.data;
}

function extensionForMime(mime: AllowedMime): "jpg" | "png" | "webp" {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

function publicFile(publicUrl: string): string {
  const absolute = path.resolve(PUBLIC_DIR, publicUrl.slice(1));
  const publicRoot = `${path.resolve(PUBLIC_DIR)}${path.sep}`;
  if (!publicUrl.startsWith("/") || !absolute.startsWith(publicRoot)) {
    throw new Error(`Unsafe public output path: ${publicUrl}`);
  }
  return absolute;
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

function inspectBytes(bytes: Buffer, expectedMime: AllowedMime): RasterInspection {
  if (bytes.length < MIN_BYTES) {
    throw new Error(`raster-too-small:${bytes.length}`);
  }
  if (bytes.length > MAX_BYTES) {
    throw new Error(`raster-too-large:${bytes.length}`);
  }
  const detectedMime = detectMime(bytes);
  if (detectedMime === null) {
    throw new Error("invalid-raster-magic");
  }
  if (detectedMime !== expectedMime) {
    throw new Error(`mime-magic-mismatch:${expectedMime}:${detectedMime}`);
  }
  return {
    mime: detectedMime,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
}

function inspectFile(filePath: string, expectedMime: AllowedMime): RasterInspection {
  return inspectBytes(fs.readFileSync(filePath), expectedMime);
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return true;
  }
  const [a = 0, b = 0] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) return isPrivateIpv4(address);
  if (ipVersion !== 6) return true;
  const normalized = address.toLowerCase();
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized)
  ) {
    return true;
  }
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped !== undefined && isPrivateIpv4(mapped);
}

function parsePublicHttpsUrl(raw: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${label}-invalid-url`);
  }
  if (url.protocol !== "https:") throw new Error(`${label}-not-https`);
  if (url.username || url.password) throw new Error(`${label}-credentials-forbidden`);
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home.arpa") ||
    (net.isIP(hostname) !== 0 && isPrivateAddress(hostname))
  ) {
    throw new Error(`${label}-private-host-forbidden`);
  }
  return url;
}

async function assertPublicDns(url: URL): Promise<void> {
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new Error("dns-no-addresses");
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("dns-private-address-forbidden");
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchOneChain(initialUrl: URL, expectedMime: AllowedMime): Promise<Buffer> {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicDns(currentUrl);
    networkRequestsStarted += 1;
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        accept: expectedMime,
        "user-agent": "MedUzProductAssetFetcher/2.0",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (location === null) throw new Error("redirect-without-location");
      if (redirectCount === MAX_REDIRECTS) throw new Error("too-many-redirects");
      currentUrl = parsePublicHttpsUrl(
        new URL(location, currentUrl).toString(),
        "redirect",
      );
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();
      if (isRetryableStatus(response.status)) {
        throw new Error(`retryable-http-${response.status}`);
      }
      throw new Error(`http-${response.status}`);
    }

    const responseMime = (response.headers.get("content-type") ?? "")
      .split(";", 1)[0]
      ?.trim()
      .toLowerCase();
    if (responseMime !== expectedMime) {
      await response.body?.cancel();
      throw new Error(`content-type-mismatch:${responseMime || "missing"}`);
    }

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
      await response.body?.cancel();
      throw new Error(`content-length-too-large:${declaredLength}`);
    }
    if (response.body === null) throw new Error("empty-response-body");

    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let received = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      received += chunk.value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        throw new Error(`response-too-large:${received}`);
      }
      chunks.push(Buffer.from(chunk.value));
    }
    return Buffer.concat(chunks, received);
  }
  throw new Error("redirect-loop");
}

async function downloadWithRetries(url: URL, expectedMime: AllowedMime): Promise<Buffer> {
  let lastReason = "download-not-attempted";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fetchOneChain(url, expectedMime);
    } catch (error) {
      lastReason = error instanceof Error ? error.message : "download-failed";
      if (attempt < MAX_ATTEMPTS) {
        await new Promise<void>((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  }
  throw new Error(`download-failed-after-${MAX_ATTEMPTS}-attempts:${lastReason}`);
}

function writeFileAtomic(filePath: string, bytes: Buffer): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, bytes, { flag: "wx", mode: 0o644 });
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function writeTextAtomicIfChanged(filePath: string, content: string): boolean {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === content) {
    return false;
  }
  writeFileAtomic(filePath, Buffer.from(content, "utf8"));
  return true;
}

function sanitizeTsv(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ");
}

function writeFailureReport(rows: readonly FailureRow[]): boolean {
  const lines = [
    "product_id\texpected_file\treason",
    ...rows.map((row) =>
      [row.productId, row.expectedFile, row.reason].map(sanitizeTsv).join("\t"),
    ),
  ];
  return writeTextAtomicIfChanged(FAILURE_REPORT_PATH, `${lines.join("\n")}\n`);
}

async function processEntry(
  entry: SourceEntry,
): Promise<{ entry: SourceEntry; outcome: "downloaded" | "skipped"; failure: FailureRow | null }> {
  const reasons: string[] = [];
  if (entry.sourcePageUrl === "") reasons.push("source-page-unresolved");
  else parsePublicHttpsUrl(entry.sourcePageUrl, "source-page");
  if (entry.directImageUrl === "") reasons.push("direct-image-url-unresolved");
  else parsePublicHttpsUrl(entry.directImageUrl, "direct-image");
  if (!entry.exactMatchConfirmed) reasons.push("exact-match-not-confirmed");
  if (!entry.rightsConfirmed) reasons.push("usage-rights-not-confirmed");

  const destination = publicFile(entry.expectedFile);
  let existing: RasterInspection | null = null;
  if (fs.existsSync(destination)) {
    try {
      existing = inspectFile(destination, entry.expectedMime);
    } catch (error) {
      reasons.push(error instanceof Error ? `existing-${error.message}` : "existing-invalid");
    }
  } else {
    reasons.push("local-file-missing");
  }

  if (existing !== null && entry.sha256 !== undefined && existing.sha256 !== entry.sha256) {
    reasons.push("existing-sha256-mismatch");
  }

  if (reasons.length > 0) {
    return {
      entry,
      outcome: "skipped",
      failure: {
        productId: entry.productId,
        expectedFile: entry.expectedFile,
        reason: [...new Set(reasons)].join(","),
      },
    };
  }

  if (existing !== null && entry.sha256 === existing.sha256) {
    return { entry, outcome: "skipped", failure: null };
  }
  if (existing !== null) {
    return {
      entry,
      outcome: "skipped",
      failure: {
        productId: entry.productId,
        expectedFile: entry.expectedFile,
        reason: "valid-existing-file-without-matching-manifest-sha256",
      },
    };
  }

  const directUrl = parsePublicHttpsUrl(entry.directImageUrl, "direct-image");
  const bytes = await downloadWithRetries(directUrl, entry.expectedMime);
  const inspection = inspectBytes(bytes, entry.expectedMime);
  writeFileAtomic(destination, bytes);
  return {
    entry: {
      ...entry,
      retrievedAt: new Date().toISOString(),
      sha256: inspection.sha256,
    },
    outcome: "downloaded",
    failure: null,
  };
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const unsupported = process.argv.slice(2).filter((argument) => argument !== "--force");
  if (unsupported.length > 0) {
    throw new Error(`Unsupported argument(s): ${unsupported.join(" ")}`);
  }
  if (force) {
    console.warn(
      "--force does not bypass exact-match, rights, URL, MIME, magic-byte, or SHA gates.",
    );
  }

  const manifest = readManifest();
  const nextProducts: SourceEntry[] = [];
  const failures: FailureRow[] = [];
  let downloaded = 0;
  let skipped = 0;

  for (const [index, entry] of manifest.products.entries()) {
    try {
      const result = await processEntry(entry);
      nextProducts.push(result.entry);
      if (result.outcome === "downloaded") downloaded += 1;
      else skipped += 1;
      if (result.failure !== null) failures.push(result.failure);
      console.log(
        `[${index + 1}/${manifest.products.length}] ${result.failure === null ? result.outcome : "blocked"} ${entry.productId}`,
      );
    } catch (error) {
      nextProducts.push(entry);
      skipped += 1;
      const reason = error instanceof Error ? error.message : "unexpected-failure";
      failures.push({
        productId: entry.productId,
        expectedFile: entry.expectedFile,
        reason,
      });
      console.error(`[${index + 1}/${manifest.products.length}] failed ${entry.productId}: ${reason}`);
    }
  }

  const shaOwners = new Map<string, string>();
  for (const entry of nextProducts) {
    if (entry.sha256 === undefined) continue;
    const priorOwner = shaOwners.get(entry.sha256);
    if (priorOwner !== undefined && priorOwner !== entry.productId) {
      failures.push({
        productId: entry.productId,
        expectedFile: entry.expectedFile,
        reason: `duplicate-image-bytes-with:${priorOwner}`,
      });
    } else {
      shaOwners.set(entry.sha256, entry.productId);
    }
  }

  const nextManifest: SourceManifest = { version: 1, products: nextProducts };
  const manifestChanged = writeTextAtomicIfChanged(
    SOURCE_MANIFEST_PATH,
    `${JSON.stringify(nextManifest, null, 2)}\n`,
  );
  const reportChanged = writeFailureReport(failures);
  console.log(
    JSON.stringify(
      {
        canonicalProducts: nextProducts.length,
        downloaded,
        skipped,
        blocked: failures.length,
        networkRequestsStarted,
        manifestChanged,
        failureReportChanged: reportChanged,
        failureReport: path.relative(PROJECT_ROOT, FAILURE_REPORT_PATH),
      },
      null,
      2,
    ),
  );
  if (failures.length > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unexpected image pipeline failure");
  process.exitCode = 1;
});
