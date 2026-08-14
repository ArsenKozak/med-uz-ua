import fs from "node:fs";
import path from "node:path";
import { z } from "astro/zod";
import {
  MEDICAL_PRICE_ITEMS,
  MEDICAL_PRICE_LIST_META,
} from "../src/data/medical-prices.ts";
import {
  MEDICAL_SERVICE_NOTE_TRANSLATIONS,
  MEDICAL_SERVICE_TRANSLATIONS,
} from "../src/lib/medical-prices.ts";
import { productSchema } from "../src/schemas/product.ts";

const PROJECT_ROOT = process.cwd();
const DIST_DIR = path.join(PROJECT_ROOT, "dist");
const PRODUCT_DIR = path.join(PROJECT_ROOT, "src", "content", "products");
const PRODUCT_MANIFEST_FILE = path.join(
  PROJECT_ROOT,
  "scripts",
  "seed-products.manifest.json",
);
const PRODUCT_SEED_FILE = path.join(PROJECT_ROOT, "shop_seed.json");
const APPOINTMENT_API_FILE = path.join(
  PROJECT_ROOT,
  "src",
  "pages",
  "api",
  "appointments.ts",
);
const APPOINTMENT_FORM_FILE = path.join(
  PROJECT_ROOT,
  "src",
  "components",
  "clinic",
  "AppointmentForm.astro",
);
const LEAD_DISPATCHER_FILE = path.join(
  PROJECT_ROOT,
  "src",
  "lib",
  "leads",
  "dispatcher.ts",
);
const WRANGLER_FILE = path.join(PROJECT_ROOT, "wrangler.jsonc");
const WORKER_ENTRY_FILE = path.join(DIST_DIR, "_worker.js", "index.js");

const REQUIRED_WORKER_MAIN = "./dist/_worker.js/index.js";
const REQUIRED_ASSETS_DIRECTORY = "./dist";
const SITE_ORIGIN = "https://med.uz.ua";
const EXPECTED_PRODUCT_COUNT = 60;
const EXPECTED_PRODUCTS_PER_CATEGORY = 15;
const EXPECTED_PRICE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 38, 39, 40,
] as const;
const REMOVED_PRICE_IDS = [34, 35, 36, 37] as const;
const EXPECTED_PRICE_COUNT = EXPECTED_PRICE_IDS.length;
const LOCALIZED_MEDICAL_LOCALES = ["sk", "en", "hu"] as const;
const REMOVED_MEDICAL_TEXT_PATTERN =
  /(?:parabul|subconj|парабул|субкон|космет|cosmet|kozmet|ін[’'ʼ]?єкції та терап|injections?\s*(?:&|and)\s*therapy|injekcie a terapia|injekciók és terápia)/iu;

const EXPECTED_PRICES_UAH: readonly number[] = [
  800, 700, 700, 700, 600, 600, 200, 200, 200, 300, 400, 300, 200, 300,
  150, 250, 300, 200, 50, 300, 350, 300, 400, 600, 200, 300, 200, 1200,
  400, 400, 700, 300, 200, 600, 300, 100,
];

const KNOWN_INVALID_IMAGE_PATHS: readonly string[] = [
  "/images/shop/sunglasses/sunglass-oakley-sport-03.jpg",
  "/images/shop/sunglasses/sunglass-tomford-luxury-05.jpg",
];

interface LocaleConfig {
  readonly code: string;
  readonly prefix: string;
}

const LOCALES: readonly LocaleConfig[] = [
  { code: "uk", prefix: "" },
  { code: "sk", prefix: "sk" },
  { code: "en", prefix: "en" },
  { code: "hu", prefix: "hu" },
];

const CORE_ROUTES: readonly string[] = [
  "",
  "services",
  "services/programs",
  "services/pediatric",
  "shop",
  "about",
  "contacts",
  "offer",
  "privacy",
];

const EXPECTED_PRODUCT_CATEGORIES: readonly string[] = [
  "lenses",
  "frames",
  "sunglasses",
  "care",
];

const manifestSchema = z
  .object({
    version: z.literal(1),
    generatedFiles: z.array(
      z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    ),
  })
  .strict();

const seedCatalogSchema = z
  .array(
    z
      .object({
        id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        title: z.string().trim().min(1),
        category: z.enum(["lenses", "frames", "sunglasses", "care"]),
        brand: z.string().trim().min(1),
        price: z.number().int().positive().refine(Number.isSafeInteger),
        inStock: z.boolean(),
        image: z
          .string()
          .regex(
            /^\/images\/shop\/(?:lenses|frames|sunglasses|care)\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|avif)$/i,
          )
          .refine((value) => !value.includes("..") && !value.includes("\\")),
        description: z.string().trim().min(1),
      })
      .strict(),
  )
  .length(EXPECTED_PRODUCT_COUNT);

const wranglerSchema = z
  .object({
    main: z.literal(REQUIRED_WORKER_MAIN),
    assets: z
      .object({
        directory: z.literal(REQUIRED_ASSETS_DIRECTORY),
      })
      .passthrough(),
  })
  .passthrough();

const failures: string[] = [];

function fail(scope: string, message: string): void {
  failures.push(`[${scope}] ${message}`);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readText(filePath: string, scope: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(scope, `Cannot read ${path.relative(PROJECT_ROOT, filePath)}: ${describeError(error)}`);
    return null;
  }
}

function parseJsonUnknown(rawJson: string, sourceName: string): unknown | null {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    return parsed;
  } catch (error) {
    fail("json", `${sourceName} is not valid JSON: ${describeError(error)}`);
    return null;
  }
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
    } else if (character === "/" && nextCharacter === "*") {
      inBlockComment = true;
      index += 1;
    } else if (character === "/" && nextCharacter === "/") {
      inLineComment = true;
      index += 1;
    } else {
      output += character;
    }
  }

  if (inBlockComment || inString) {
    throw new Error("Unterminated block comment or string in JSONC input.");
  }

  return output;
}

function stripJsonTrailingCommas(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? "";

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

    if (character === ",") {
      let lookahead = index + 1;
      while (/\s/.test(input[lookahead] ?? "")) {
        lookahead += 1;
      }
      const nextSignificantCharacter = input[lookahead] ?? "";
      if ("]}".includes(nextSignificantCharacter)) {
        continue;
      }
    }

    output += character;
  }

  if (inString) {
    throw new Error("Unterminated string in JSONC input.");
  }

  return output;
}

function parseJsoncUnknown(rawJsonc: string, sourceName: string): unknown | null {
  try {
    return parseJsonUnknown(
      stripJsonTrailingCommas(stripJsonComments(rawJsonc)),
      sourceName,
    );
  } catch (error) {
    fail("json", `${sourceName} is not valid JSONC: ${describeError(error)}`);
    return null;
  }
}

function isNonEmptyFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile() && fs.statSync(filePath).size > 0;
  } catch {
    return false;
  }
}

function listFilesRecursively(directory: string, extension: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(entryPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function getHtmlAttribute(tag: string, attributeName: string): string | null {
  const expression = new RegExp(
    `\\s${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = expression.exec(tag);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

function getHtmlTags(html: string, tagName: string): string[] {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))).map(
    (match) => match[0] ?? "",
  );
}

function getRasterKind(filePath: string): string | null {
  if (!isNonEmptyFile(filePath)) return null;
  const bytes = fs.readFileSync(filePath);

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

function routePublicPath(locale: LocaleConfig, route: string): string {
  const segments = [locale.prefix, route].filter((segment) => segment.length > 0);
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`;
}

function routeOutputFile(locale: LocaleConfig, route: string): string {
  const segments = [locale.prefix, route].filter((segment) => segment.length > 0);
  return path.join(DIST_DIR, ...segments, "index.html");
}

function verifyProtectedInfrastructure(): void {
  const wranglerSource = readText(WRANGLER_FILE, "cloudflare");
  if (wranglerSource !== null) {
    const wranglerData = parseJsoncUnknown(wranglerSource, "wrangler.jsonc");
    const wranglerResult = wranglerSchema.safeParse(wranglerData);
    if (!wranglerResult.success) {
      fail(
        "cloudflare",
        `wrangler.jsonc must preserve main=${JSON.stringify(REQUIRED_WORKER_MAIN)} and assets.directory=${JSON.stringify(REQUIRED_ASSETS_DIRECTORY)}: ${wranglerResult.error.message}`,
      );
    }
  }

  if (!isNonEmptyFile(WORKER_ENTRY_FILE)) {
    fail(
      "cloudflare",
      "Built Worker entry dist/_worker.js/index.js is missing or empty. Run `pnpm build` before `pnpm verify:stage6`.",
    );
  }
}

function verifyMedicalPrices(): void {
  if (MEDICAL_PRICE_ITEMS.length !== EXPECTED_PRICE_COUNT) {
    fail(
      "prices",
      `Expected ${EXPECTED_PRICE_COUNT} official medical prices, received ${MEDICAL_PRICE_ITEMS.length}.`,
    );
  }

  if (EXPECTED_PRICES_UAH.length !== EXPECTED_PRICE_COUNT) {
    fail("prices", "The embedded canonical price table is incomplete.");
  }

  const itemsById = new Map<
    number,
    (typeof MEDICAL_PRICE_ITEMS)[number]
  >();
  for (const item of MEDICAL_PRICE_ITEMS) {
    itemsById.set(item.id, item);
  }
  if (itemsById.size !== MEDICAL_PRICE_ITEMS.length) {
    fail("prices", "Duplicate official medical price IDs were found.");
  }

  for (const [index, id] of EXPECTED_PRICE_IDS.entries()) {
    const item = itemsById.get(id);
    const expectedPrice = EXPECTED_PRICES_UAH[index];
    if (!item) {
      fail("prices", `Official medical price ID ${id} is missing.`);
    } else if (expectedPrice === undefined || item.priceUah !== expectedPrice) {
      fail(
        "prices",
        `Price mismatch for ID ${id}: expected ${expectedPrice ?? "missing canonical value"} UAH, received ${item.priceUah} UAH.`,
      );
    }
  }

  for (const removedId of REMOVED_PRICE_IDS) {
    if (itemsById.has(removedId)) {
      fail("prices", `Removed medical price ID ${removedId} is still present.`);
    }
  }

  for (const item of MEDICAL_PRICE_ITEMS) {
    const translations = MEDICAL_SERVICE_TRANSLATIONS[item.id];

    for (const locale of LOCALIZED_MEDICAL_LOCALES) {
      const translatedName = translations[locale];
      if (translatedName.trim().length === 0) {
        fail(
          "prices",
          `Missing ${locale.toUpperCase()} medical translation for ID ${item.id}.`,
        );
      }
      if (
        item.id !== 28 &&
        REMOVED_MEDICAL_TEXT_PATTERN.test(translatedName)
      ) {
        fail(
          "prices",
          `${locale.toUpperCase()} medical translation for ID ${item.id} retains removed therapy wording.`,
        );
      }
    }

    if ("noteUk" in item && (item as any).noteUk !== undefined) {
      const noteTranslations = MEDICAL_SERVICE_NOTE_TRANSLATIONS[item.id];
      for (const locale of LOCALIZED_MEDICAL_LOCALES) {
        if (!noteTranslations?.[locale]?.trim()) {
          fail(
            "prices",
            `Missing ${locale.toUpperCase()} medical note translation for ID ${item.id}.`,
          );
        }
      }
    }
  }

  const verifyMetadataValue = (
    key: string,
    actualValue: string,
    expectedValue: string,
  ): void => {
    if (actualValue !== expectedValue) {
      fail(
        "prices",
        `Official metadata ${key} mismatch: expected ${JSON.stringify(expectedValue)}, received ${JSON.stringify(actualValue)}.`,
      );
    }
  };

  verifyMetadataValue(
    "approvedOn",
    MEDICAL_PRICE_LIST_META.approvedOn,
    "2025-11-11",
  );
  verifyMetadataValue(
    "legalEntity",
    MEDICAL_PRICE_LIST_META.legalEntity,
    "ФОП ЛЕНЬО МИРОСЛАВА ЮРІЇВНА",
  );
  verifyMetadataValue("currency", MEDICAL_PRICE_LIST_META.currency, "UAH");
  verifyMetadataValue(
    "officialAddress",
    MEDICAL_PRICE_LIST_META.officialAddress,
    'ЗАКАРПАТСЬКА ОБЛ., М. УЖГОРОД, вул. Гойди Юрія, 10 "а", корп. 5, прим. 436',
  );
}

function verifyProductCatalog(): void {
  const manifestSource = readText(PRODUCT_MANIFEST_FILE, "catalog");
  if (manifestSource === null) return;
  const manifestData = parseJsonUnknown(manifestSource, "seed-products.manifest.json");
  const manifestResult = manifestSchema.safeParse(manifestData);
  if (!manifestResult.success) {
    fail("catalog", `Product manifest is invalid: ${manifestResult.error.message}`);
    return;
  }

  const generatedFiles = manifestResult.data.generatedFiles;
  const generatedFileSet = new Set(generatedFiles);

  const seedSource = readText(PRODUCT_SEED_FILE, "catalog");
  if (seedSource === null) return;
  const seedData = parseJsoncUnknown(seedSource, "shop_seed.json");
  const seedResult = seedCatalogSchema.safeParse(seedData);
  if (!seedResult.success) {
    fail("catalog", `shop_seed.json is invalid: ${seedResult.error.message}`);
    return;
  }
  const seedFiles = seedResult.data
    .map((product) => `${product.id}.json`)
    .sort();
  const uniqueSeedFiles = new Set(seedFiles);
  if (uniqueSeedFiles.size !== EXPECTED_PRODUCT_COUNT) {
    fail("catalog", "shop_seed.json contains duplicate product IDs.");
  }
  const sortedGeneratedFiles = [...generatedFiles].sort();
  if (
    seedFiles.length !== sortedGeneratedFiles.length ||
    seedFiles.some((filename, index) => filename !== sortedGeneratedFiles[index])
  ) {
    fail(
      "catalog",
      "shop_seed.json IDs and seed-products.manifest.json must match exactly. Run `pnpm seed:products`.",
    );
  }
  if (generatedFiles.length !== EXPECTED_PRODUCT_COUNT) {
    fail(
      "catalog",
      `Manifest must list ${EXPECTED_PRODUCT_COUNT} generated products, received ${generatedFiles.length}. Run \`pnpm seed:products\`.`,
    );
  }
  if (generatedFileSet.size !== generatedFiles.length) {
    fail("catalog", "Product manifest contains duplicate generated filenames.");
  }

  const categoryCounts = new Map<string, number>();
  for (const category of EXPECTED_PRODUCT_CATEGORIES) {
    categoryCounts.set(category, 0);
  }

  const generatedIds = new Set<string>();
  const activeProductFiles = new Set<string>();
  const contentFiles = fs.existsSync(PRODUCT_DIR)
    ? fs
        .readdirSync(PRODUCT_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name)
        .sort()
    : [];

  if (contentFiles.length === 0) {
    fail("catalog", "No product content files were found in src/content/products.");
  }

  for (const filename of contentFiles) {
    const source = readText(path.join(PRODUCT_DIR, filename), "catalog");
    if (source === null) continue;
    const parsed = parseJsonUnknown(source, `src/content/products/${filename}`);
    const result = productSchema.safeParse(parsed);
    if (!result.success) {
      fail("catalog", `${filename} fails the product schema: ${result.error.message}`);
      continue;
    }

    if (result.data.status === "active") {
      activeProductFiles.add(filename);
    }

    if (!generatedFileSet.has(filename)) continue;
    if (result.data.status !== "active") {
      fail("catalog", `Generated product ${filename} must have status=active.`);
    }

    const productId = path.basename(filename, ".json");
    if (generatedIds.has(productId)) {
      fail("catalog", `Duplicate generated product ID ${productId}.`);
    }
    generatedIds.add(productId);
    categoryCounts.set(
      result.data.category,
      (categoryCounts.get(result.data.category) ?? 0) + 1,
    );
  }

  for (const filename of generatedFiles) {
    if (!contentFiles.includes(filename)) {
      fail("catalog", `Manifest entry ${filename} does not exist in src/content/products.`);
    }
  }

  for (const filename of activeProductFiles) {
    if (!generatedFileSet.has(filename)) {
      fail("catalog", `Active product ${filename} is absent from the generated manifest.`);
    }
  }

  if (generatedIds.size !== EXPECTED_PRODUCT_COUNT) {
    fail(
      "catalog",
      `Expected ${EXPECTED_PRODUCT_COUNT} unique generated product IDs, received ${generatedIds.size}.`,
    );
  }

  for (const category of EXPECTED_PRODUCT_CATEGORIES) {
    const actualCount = categoryCounts.get(category) ?? 0;
    if (actualCount !== EXPECTED_PRODUCTS_PER_CATEGORY) {
      fail(
        "catalog",
        `Category ${category} must contain ${EXPECTED_PRODUCTS_PER_CATEGORY} generated products, received ${actualCount}.`,
      );
    }
  }
}

function verifyRouteDocument(
  locale: LocaleConfig,
  route: string,
  html: string,
): void {
  const routeLabel = routePublicPath(locale, route);
  const htmlTags = getHtmlTags(html, "html");
  const documentLang = htmlTags.length > 0
    ? getHtmlAttribute(htmlTags[0] ?? "", "lang")
    : null;
  if (documentLang !== locale.code) {
    fail(
      "routes",
      `${routeLabel} must render <html lang=${JSON.stringify(locale.code)}>, received ${JSON.stringify(documentLang)}.`,
    );
  }

  const canonicalHrefs: string[] = [];
  const alternateHrefs = new Map<string, string[]>();
  for (const linkTag of getHtmlTags(html, "link")) {
    const relTokens = (getHtmlAttribute(linkTag, "rel") ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 0);
    const href = getHtmlAttribute(linkTag, "href");
    if (relTokens.includes("canonical") && href !== null) {
      canonicalHrefs.push(href);
    }
    if (relTokens.includes("alternate") && href !== null) {
      const hreflang = getHtmlAttribute(linkTag, "hreflang");
      if (hreflang !== null) {
        const values = alternateHrefs.get(hreflang) ?? [];
        values.push(href);
        alternateHrefs.set(hreflang, values);
      }
    }
  }

  const expectedCanonical = new URL(routeLabel, SITE_ORIGIN).href;
  if (canonicalHrefs.length !== 1 || canonicalHrefs[0] !== expectedCanonical) {
    fail(
      "routes",
      `${routeLabel} canonical must be exactly ${expectedCanonical}; received ${JSON.stringify(canonicalHrefs)}.`,
    );
  }

  for (const alternateLocale of LOCALES) {
    const expectedHref = new URL(
      routePublicPath(alternateLocale, route),
      SITE_ORIGIN,
    ).href;
    const actualHrefs = alternateHrefs.get(alternateLocale.code) ?? [];
    if (actualHrefs.length !== 1 || actualHrefs[0] !== expectedHref) {
      fail(
        "routes",
        `${routeLabel} hreflang=${alternateLocale.code} must be exactly ${expectedHref}; received ${JSON.stringify(actualHrefs)}.`,
      );
    }
  }

  const expectedDefaultHref = new URL(
    routePublicPath(LOCALES[0] ?? { code: "uk", prefix: "" }, route),
    SITE_ORIGIN,
  ).href;
  const actualDefaultHrefs = alternateHrefs.get("x-default") ?? [];
  if (actualDefaultHrefs.length !== 1 || actualDefaultHrefs[0] !== expectedDefaultHref) {
    fail(
      "routes",
      `${routeLabel} hreflang=x-default must be exactly ${expectedDefaultHref}; received ${JSON.stringify(actualDefaultHrefs)}.`,
    );
  }
}

function verifyRoutesAndPrices(): Map<string, string> {
  const htmlDocuments = new Map<string, string>();

  if (!fs.existsSync(DIST_DIR)) {
    fail("routes", "dist is missing. Run `pnpm build` before `pnpm verify:stage6`.");
    return htmlDocuments;
  }

  if (fs.existsSync(path.join(DIST_DIR, "uk"))) {
    fail("routes", "dist/uk must not exist; Ukrainian is the unprefixed default locale.");
  }

  for (const locale of LOCALES) {
    for (const route of CORE_ROUTES) {
      const outputFile = routeOutputFile(locale, route);
      const routeLabel = routePublicPath(locale, route);
      const html = readText(outputFile, "routes");
      if (html === null) {
        fail("routes", `Required built route ${routeLabel} is missing.`);
        continue;
      }
      htmlDocuments.set(outputFile, html);
      verifyRouteDocument(locale, route, html);
    }

    const servicesFile = routeOutputFile(locale, "services");
    const servicesHtml = htmlDocuments.get(servicesFile);
    if (servicesHtml === undefined) continue;
    const markerIds = Array.from(
      servicesHtml.matchAll(/data-medical-price-id="(\d+)"/g),
    ).map((match) => Number(match[1] ?? Number.NaN));
    const uniqueMarkerIds = new Set(markerIds);
    if (markerIds.length !== EXPECTED_PRICE_COUNT) {
      fail(
        "prices",
        `${routePublicPath(locale, "services")} must render ${EXPECTED_PRICE_COUNT} medical price markers, received ${markerIds.length}.`,
      );
    }
    if (uniqueMarkerIds.size !== markerIds.length) {
      fail(
        "prices",
        `${routePublicPath(locale, "services")} contains duplicate medical price markers.`,
      );
    }
    for (const id of EXPECTED_PRICE_IDS) {
      if (!uniqueMarkerIds.has(id)) {
        fail(
          "prices",
          `${routePublicPath(locale, "services")} is missing data-medical-price-id=${id}.`,
        );
      }
    }
    for (const removedId of REMOVED_PRICE_IDS) {
      if (uniqueMarkerIds.has(removedId)) {
        fail(
          "prices",
          `${routePublicPath(locale, "services")} still renders removed data-medical-price-id=${removedId}.`,
        );
      }
    }
    if (REMOVED_MEDICAL_TEXT_PATTERN.test(servicesHtml)) {
      fail(
        "prices",
        `${routePublicPath(locale, "services")} still renders removed injection/cosmetology wording.`,
      );
    }
  }

  return htmlDocuments;
}

function verifyBuiltImages(htmlDocuments: Map<string, string>): void {
  const allBuiltHtmlFiles = listFilesRecursively(DIST_DIR, ".html");
  for (const htmlFile of allBuiltHtmlFiles) {
    if (!htmlDocuments.has(htmlFile)) {
      const html = readText(htmlFile, "images");
      if (html !== null) htmlDocuments.set(htmlFile, html);
    }
  }

  const referencedLocalImages = new Set<string>();
  let imageTagCount = 0;

  for (const [htmlFile, html] of htmlDocuments) {
    for (const imageTag of getHtmlTags(html, "img")) {
      imageTagCount += 1;
      const source = getHtmlAttribute(imageTag, "src");
      const width = getHtmlAttribute(imageTag, "width");
      const height = getHtmlAttribute(imageTag, "height");
      const routeFile = path.relative(DIST_DIR, htmlFile);

      if (source === null) {
        fail("images", `${routeFile} contains an <img> without src.`);
      }
      if (width === null || !/^\d+$/.test(width) || Number(width) <= 0) {
        fail(
          "images",
          `${routeFile} contains an <img> without a positive explicit width: ${imageTag.slice(0, 180)}.`,
        );
      }
      if (height === null || !/^\d+$/.test(height) || Number(height) <= 0) {
        fail(
          "images",
          `${routeFile} contains an <img> without a positive explicit height: ${imageTag.slice(0, 180)}.`,
        );
      }

      if (source === null || !source.startsWith("/") || source.startsWith("//")) {
        continue;
      }

      let pathname: string;
      try {
        pathname = decodeURIComponent(new URL(source, SITE_ORIGIN).pathname);
      } catch (error) {
        fail("images", `${routeFile} contains a malformed image src ${JSON.stringify(source)}: ${describeError(error)}`);
        continue;
      }

      referencedLocalImages.add(pathname);
    }
  }

  if (imageTagCount === 0) {
    fail("images", "No built <img> tags were found; the asset gate could not run.");
  }

  for (const pathname of referencedLocalImages) {
    const imageFile = path.resolve(DIST_DIR, `.${pathname}`);
    const distRoot = `${path.resolve(DIST_DIR)}${path.sep}`;
    if (!imageFile.startsWith(distRoot)) {
      fail("images", `Local image src escapes dist: ${pathname}.`);
      continue;
    }

    if (getRasterKind(imageFile) === null) {
      fail(
        "images",
        `${pathname} is missing or does not contain a valid JPEG, PNG, or WebP byte signature.`,
      );
    }
  }

  for (const invalidImagePath of KNOWN_INVALID_IMAGE_PATHS) {
    if (referencedLocalImages.has(invalidImagePath)) {
      fail(
        "images",
        `Known invalid image must not be rendered: ${invalidImagePath}. Replace it with a verified product image or labeled editorial fallback.`,
      );
    }
  }
}

function verifyAppointmentContract(): void {
  const source = readText(APPOINTMENT_FORM_FILE, "appointment");
  const apiSource = readText(APPOINTMENT_API_FILE, "appointment");
  const dispatcherSource = readText(LEAD_DISPATCHER_FILE, "appointment");
  if (source === null || apiSource === null || dispatcherSource === null) return;

  const requiredMarkers: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    {
      label: "absolute native form action",
      pattern: /action\s*=\s*["']\/api\/appointments["']/,
    },
    {
      label: "absolute fetch endpoint",
      pattern: /fetch\(\s*["']\/api\/appointments["']\s*,/,
    },
    { label: "POST method", pattern: /method\s*:\s*["']POST["']/ },
    {
      label: "name, phone, honeypot and timing JSON payload",
      pattern: /body\s*:\s*JSON\.stringify\(\s*{\s*name\s*,\s*phone\s*,\s*website\s*,\s*elapsedMs\s*}\s*\)/,
    },
    { label: "name field", pattern: /name\s*=\s*["']name["']/ },
    { label: "phone field", pattern: /name\s*=\s*["']phone["']/ },
    { label: "honeypot field", pattern: /name\s*=\s*["']website["']/ },
    { label: "linked name error", pattern: /aria-describedby\s*=\s*["']appointment-name-error["']/ },
    { label: "linked phone error", pattern: /aria-describedby\s*=\s*["']appointment-phone-error["']/ },
    { label: "successful field reset", pattern: /form\.reset\(\)/ },
    {
      label: "appointment success analytics",
      pattern: /trackAppointmentSuccess\(\)/,
    },
  ];

  for (const marker of requiredMarkers) {
    if (!marker.pattern.test(source)) {
      fail(
        "appointment",
        `AppointmentForm.astro is missing the required ${marker.label} contract marker.`,
      );
    }
  }

  const apiMarkers: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    { label: "shared appointment schema", pattern: /appointmentSchema/ },
    { label: "server safeParse boundary", pattern: /appointmentSchema\.safeParse\(body\)/ },
    { label: "same-origin validation", pattern: /hasValidOrigin\(request\)/ },
    { label: "bounded request body", pattern: /MAX_BODY_BYTES\s*=\s*4_096/ },
    { label: "JSON-only input", pattern: /application\/json/ },
    { label: "awaited dispatch", pattern: /await dispatchAppointment\(result\.data\)/ },
    {
      label: "server-bound dispatcher",
      pattern: /createLeadDispatcher\(locals\.runtime\.env\)/,
    },
  ];
  for (const marker of apiMarkers) {
    if (!marker.pattern.test(apiSource)) {
      fail("appointment", `appointments.ts is missing ${marker.label}.`);
    }
  }
  if (/console\.(?:log|info|warn|error|debug)/.test(`${source}\n${apiSource}`)) {
    fail("appointment", "Appointment UI/API must not log patient input.");
  }
  for (const binding of ["LEAD_API_URL", "LEAD_API_TOKEN"] as const) {
    if (!dispatcherSource.includes(binding)) {
      fail("appointment", `Lead dispatcher is missing the ${binding} server binding.`);
    }
  }
  if (/mockTelegramFetch|\.invalid\/mock/.test(dispatcherSource)) {
    fail("appointment", "Lead dispatcher must not use an always-successful mock.");
  }
}

verifyProtectedInfrastructure();
verifyMedicalPrices();
verifyProductCatalog();
const htmlDocuments = verifyRoutesAndPrices();
verifyBuiltImages(htmlDocuments);
verifyAppointmentContract();

if (failures.length > 0) {
  console.error(`Stage 6 verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Stage 6 static verification passed:");
  console.log(`- appointment API: shared schema, origin/body/content-type, awaited dispatch gates passed`);
  console.log(`- retained medical prices: ${EXPECTED_PRICE_COUNT} stable canonical IDs`);
  console.log(`- generated catalog: ${EXPECTED_PRODUCT_COUNT} unique products (${EXPECTED_PRODUCTS_PER_CATEGORY} per category)`);
  console.log(`- localized core routes: ${LOCALES.length * CORE_ROUTES.length}`);
  console.log("- canonical, hreflang, image-byte, image-dimension, appointment, Worker, and Wrangler gates: passed");
  console.log("- external lead delivery, provider accounts, and production deployment require separate verification");
}
