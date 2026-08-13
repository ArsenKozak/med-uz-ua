import type { ProductSummary } from "../cms";
import type { CheckoutRequest } from "../../schemas/checkout";

export interface CanonicalCheckoutLine {
  readonly productId: string;
  readonly quantity: number;
  readonly title: string;
  readonly unitPriceMinor: number;
  readonly lineTotalMinor: number;
  readonly currency: "UAH";
}

export interface CanonicalCheckoutCart {
  readonly lines: readonly CanonicalCheckoutLine[];
  readonly subtotalMinor: number;
  readonly currency: "UAH";
  readonly delivery: CheckoutRequest["delivery"];
}

export type CanonicalCheckoutError =
  | "DUPLICATE_PRODUCT"
  | "PRODUCT_UNAVAILABLE"
  | "PRICE_UNAVAILABLE"
  | "UNSUPPORTED_CURRENCY"
  | "TOTAL_OVERFLOW";

export type CanonicalCheckoutResult =
  | { readonly ok: true; readonly cart: CanonicalCheckoutCart }
  | { readonly ok: false; readonly error: CanonicalCheckoutError };

/**
 * Rebuilds a checkout cart exclusively from the current server-side catalog.
 * Client snapshots, titles, prices, totals and discounts are intentionally not
 * represented in the input type and therefore cannot affect this calculation.
 */
export function buildCanonicalCheckoutCart(
  request: CheckoutRequest,
  catalog: readonly ProductSummary[],
): CanonicalCheckoutResult {
  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  const seenProductIds = new Set<string>();
  const lines: CanonicalCheckoutLine[] = [];
  let subtotalMinor = 0;

  for (const requestedLine of request.items) {
    if (seenProductIds.has(requestedLine.productId)) {
      return { ok: false, error: "DUPLICATE_PRODUCT" };
    }

    seenProductIds.add(requestedLine.productId);
    const product = catalogById.get(requestedLine.productId);

    if (product === undefined || !product.inStock) {
      return { ok: false, error: "PRODUCT_UNAVAILABLE" };
    }

    if (
      product.verificationStatus !== "verified" ||
      product.priceMinor <= 0
    ) {
      return { ok: false, error: "PRICE_UNAVAILABLE" };
    }

    if (product.currency !== "UAH") {
      return { ok: false, error: "UNSUPPORTED_CURRENCY" };
    }

    const lineTotalMinor = product.priceMinor * requestedLine.quantity;
    const nextSubtotalMinor = subtotalMinor + lineTotalMinor;

    if (
      !Number.isSafeInteger(lineTotalMinor) ||
      !Number.isSafeInteger(nextSubtotalMinor)
    ) {
      return { ok: false, error: "TOTAL_OVERFLOW" };
    }

    lines.push({
      productId: product.id,
      quantity: requestedLine.quantity,
      title: product.title,
      unitPriceMinor: product.priceMinor,
      lineTotalMinor,
      currency: "UAH",
    });
    subtotalMinor = nextSubtotalMinor;
  }

  return {
    ok: true,
    cart: {
      lines: Object.freeze(lines),
      subtotalMinor,
      currency: "UAH",
      delivery: request.delivery,
    },
  };
}
