import type { ProductVerificationStatus } from "../../schemas/product";
import type { CartItem } from "../../store/cart";

const MAX_CATALOG_ENTRIES = 1_000;
const MAX_PRODUCT_ID_LENGTH = 200;
const MAX_TITLE_LENGTH = 240;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const CATALOG_PRODUCT_KEYS = Object.freeze([
  "id",
  "title",
  "priceMinor",
  "currency",
  "inStock",
  "verificationStatus",
]);

export interface CartCatalogProduct {
  readonly id: string;
  readonly title: string;
  
  readonly image: string;
readonly priceMinor: number;
  readonly currency: string;
  readonly inStock: boolean;
  readonly verificationStatus: ProductVerificationStatus;
}

export interface ResolvedCartLine {
  readonly productId: string;
  readonly quantity: number;
  readonly title: string;
  
  readonly image: string;
readonly unitPriceMinor: number;
  readonly currency: string;
  readonly verificationStatus: ProductVerificationStatus;
  readonly availability: "available" | "unavailable";
}

export interface ResolvedCart {
  readonly lines: readonly ResolvedCartLine[];
  readonly count: number;
  readonly subtotalMinor: number | null;
  readonly currency: string | null;
  readonly hasPendingPricing: boolean;
  readonly hasUnavailableLines: boolean;
}

const EMPTY_CATALOG: readonly CartCatalogProduct[] = Object.freeze([]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyCatalogProductKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);

  return (
    keys.length === CATALOG_PRODUCT_KEYS.length &&
    CATALOG_PRODUCT_KEYS.every((key) =>
      Object.prototype.hasOwnProperty.call(value, key),
    )
  );
}

function isSafeText(
  value: unknown,
  maximumLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximumLength &&
    value === value.trim() &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function isVerificationStatus(
  value: unknown,
): value is ProductVerificationStatus {
  return value === "verified" || value === "pending-clinic-confirmation";
}

function decodeCatalogProduct(value: unknown): CartCatalogProduct | null {
  if (!isRecord(value) || !hasOnlyCatalogProductKeys(value)) {
    return null;
  }

  const {
    id,
    title,
    image,
    priceMinor,
    currency,
    inStock,
    verificationStatus,
  } = value;

  if (
    !isSafeText(id, MAX_PRODUCT_ID_LENGTH) ||
    !isSafeText(title, MAX_TITLE_LENGTH) ||
      typeof image !== "string" ||
      image.length === 0 ||
      image.length > 500 ||
    typeof priceMinor !== "number" ||
    !Number.isSafeInteger(priceMinor) ||
    priceMinor < 0 ||
    typeof currency !== "string" ||
    !CURRENCY_PATTERN.test(currency) ||
    typeof inStock !== "boolean" ||
    !isVerificationStatus(verificationStatus)
  ) {
    return null;
  }

  return Object.freeze({
    id,
    title,
    image,
    priceMinor,
    currency,
    inStock,
    verificationStatus,
  });
}

/** Strictly decodes the server-rendered active catalog embedded in the drawer. */
export function decodeCartCatalog(
  serializedCatalog: string | undefined,
): readonly CartCatalogProduct[] {
  if (serializedCatalog === undefined || serializedCatalog.length === 0) {
    return EMPTY_CATALOG;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serializedCatalog);
  } catch {
    return EMPTY_CATALOG;
  }

  if (!Array.isArray(parsed) || parsed.length > MAX_CATALOG_ENTRIES) {
    return EMPTY_CATALOG;
  }

  const products: CartCatalogProduct[] = [];
  const productIds = new Set<string>();

  for (const rawProduct of parsed) {
    const product = decodeCatalogProduct(rawProduct);

    if (product === null || productIds.has(product.id)) {
      return EMPTY_CATALOG;
    }

    productIds.add(product.id);
    products.push(product);
  }

  return Object.freeze(products);
}

export function createCartCatalogIndex(
  products: readonly CartCatalogProduct[],
): ReadonlyMap<string, CartCatalogProduct> {
  return new Map(products.map((product) => [product.id, product]));
}

function resolveCartLine(
  item: CartItem,
  catalog: ReadonlyMap<string, CartCatalogProduct>,
): ResolvedCartLine {
  const currentProduct = catalog.get(item.productId);

  if (currentProduct === undefined) {
    return Object.freeze({
      productId: item.productId,
      quantity: item.quantity,
      title: item.titleSnapshot,
      image: "/images/artificial/macro-lens-hydration.jpg",
      unitPriceMinor: item.unitPriceMinorSnapshot,
      currency: item.currency,
      verificationStatus: item.verificationStatusSnapshot,
      availability: "unavailable",
    });
  }

  return Object.freeze({
    productId: item.productId,
    quantity: item.quantity,
    title: currentProduct.title,
      image: currentProduct.image,
    unitPriceMinor: currentProduct.priceMinor,
    currency: currentProduct.currency,
    verificationStatus: currentProduct.verificationStatus,
    availability: currentProduct.inStock ? "available" : "unavailable",
  });
}

/**
 * Resolves persisted UI snapshots against the current active catalog.
 * Unresolved and no-longer-available IDs remain visible and removable, but are
 * deliberately excluded from current pricing.
 */
export function resolveCart(
  items: readonly CartItem[],
  catalog: ReadonlyMap<string, CartCatalogProduct>,
): ResolvedCart {
  const lines = Object.freeze(
    items.map((item) => resolveCartLine(item, catalog)),
  );
  let count = 0;
  let subtotalMinor = 0;
  let currency: string | null = null;
  let canCalculateSubtotal = true;
  let hasPendingPricing = false;
  let hasUnavailableLines = false;

  for (const line of lines) {
    count += line.quantity;

    if (line.availability === "unavailable") {
      hasUnavailableLines = true;
      canCalculateSubtotal = false;
      continue;
    }

    if (line.verificationStatus === "pending-clinic-confirmation") {
      hasPendingPricing = true;
    }

    if (currency === null) {
      currency = line.currency;
    } else if (line.currency !== currency) {
      canCalculateSubtotal = false;
    }

    const lineSubtotalMinor = line.unitPriceMinor * line.quantity;
    const nextSubtotalMinor = subtotalMinor + lineSubtotalMinor;

    if (
      !Number.isSafeInteger(lineSubtotalMinor) ||
      !Number.isSafeInteger(nextSubtotalMinor)
    ) {
      canCalculateSubtotal = false;
      continue;
    }

    subtotalMinor = nextSubtotalMinor;
  }

  return Object.freeze({
    lines,
    count,
    subtotalMinor: canCalculateSubtotal ? subtotalMinor : null,
    currency: canCalculateSubtotal ? currency : null,
    hasPendingPricing,
    hasUnavailableLines,
  });
}
