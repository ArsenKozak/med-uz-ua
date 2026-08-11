import { persistentJSON } from "@nanostores/persistent";
import { computed } from "nanostores";

export const CART_STORAGE_KEY = "meduzua:cart:v1";
const MAX_CART_LINES = 100;
const MAX_PRODUCT_ID_LENGTH = 200;
const MAX_TITLE_LENGTH = 240;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export type CartVerificationStatus =
  | "verified"
  | "pending-clinic-confirmation";

/**
 * A presentation-only product snapshot persisted in the browser.
 *
 * These values are not authoritative commerce data. A future checkout must
 * resolve `productId` against the server-side catalog and recalculate prices.
 */
export interface CartItem {
  readonly productId: string;
  readonly quantity: number;
  readonly titleSnapshot: string;
  readonly unitPriceMinorSnapshot: number;
  readonly currency: string;
  readonly verificationStatusSnapshot: CartVerificationStatus;
}

/** The smallest product shape accepted by the cart action. */
export interface AddToCartInput {
  readonly id: string;
  readonly title: string;
  readonly priceMinor: number;
  readonly currency: string;
  readonly verificationStatus: CartVerificationStatus;
}

type CartDecodeResult =
  | { readonly ok: true; readonly value: readonly CartItem[] }
  | { readonly ok: false };

const EMPTY_CART: readonly CartItem[] = Object.freeze([]);
const INVALID_CART: CartDecodeResult = Object.freeze({ ok: false });
const CART_ITEM_KEYS = Object.freeze([
  "productId",
  "quantity",
  "titleSnapshot",
  "unitPriceMinorSnapshot",
  "currency",
  "verificationStatusSnapshot",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyCartItemKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);

  return (
    keys.length === CART_ITEM_KEYS.length &&
    CART_ITEM_KEYS.every((key) =>
      Object.prototype.hasOwnProperty.call(value, key),
    )
  );
}

function isValidProductId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_PRODUCT_ID_LENGTH &&
    value === value.trim() &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function isValidTitle(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_TITLE_LENGTH &&
    value === value.trim() &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function isValidCurrency(value: unknown): value is string {
  return typeof value === "string" && CURRENCY_PATTERN.test(value);
}

function isVerificationStatus(
  value: unknown,
): value is CartVerificationStatus {
  return value === "verified" || value === "pending-clinic-confirmation";
}

function isPositiveSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function decodeCartItem(value: unknown): CartItem | null {
  if (!isRecord(value) || !hasOnlyCartItemKeys(value)) {
    return null;
  }

  const {
    productId,
    quantity,
    titleSnapshot,
    unitPriceMinorSnapshot,
    currency,
    verificationStatusSnapshot,
  } = value;

  if (
    !isValidProductId(productId) ||
    !isPositiveSafeInteger(quantity) ||
    !isValidTitle(titleSnapshot) ||
    !isNonNegativeSafeInteger(unitPriceMinorSnapshot) ||
    !isValidCurrency(currency) ||
    !isVerificationStatus(verificationStatusSnapshot)
  ) {
    return null;
  }

  return Object.freeze({
    productId,
    quantity,
    titleSnapshot,
    unitPriceMinorSnapshot,
    currency,
    verificationStatusSnapshot,
  });
}

function decodeCart(value: unknown): CartDecodeResult {
  if (!Array.isArray(value)) {
    return INVALID_CART;
  }

  const rawItems: unknown[] = value;

  if (rawItems.length > MAX_CART_LINES) {
    return INVALID_CART;
  }

  const items: CartItem[] = [];
  const productIds = new Set<string>();
  let cartCurrency: string | undefined;
  let cartCount = 0;
  let cartSubtotalMinor = 0;

  for (const rawItem of rawItems) {
    const item = decodeCartItem(rawItem);

    if (item === null || productIds.has(item.productId)) {
      return INVALID_CART;
    }

    if (cartCurrency !== undefined && item.currency !== cartCurrency) {
      return INVALID_CART;
    }

    const lineSubtotalMinor =
      item.unitPriceMinorSnapshot * item.quantity;
    const nextCartCount = cartCount + item.quantity;
    const nextCartSubtotalMinor = cartSubtotalMinor + lineSubtotalMinor;

    if (
      !Number.isSafeInteger(lineSubtotalMinor) ||
      !Number.isSafeInteger(nextCartCount) ||
      !Number.isSafeInteger(nextCartSubtotalMinor)
    ) {
      return INVALID_CART;
    }

    productIds.add(item.productId);
    cartCurrency = item.currency;
    cartCount = nextCartCount;
    cartSubtotalMinor = nextCartSubtotalMinor;
    items.push(item);
  }

  return { ok: true, value: Object.freeze(items) };
}

function isValidAddToCartInput(value: unknown): value is AddToCartInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isValidProductId(value.id) &&
    isValidTitle(value.title) &&
    isNonNegativeSafeInteger(value.priceMinor) &&
    isValidCurrency(value.currency) &&
    isVerificationStatus(value.verificationStatus)
  );
}

const $persistedCart = persistentJSON<unknown>(CART_STORAGE_KEY, EMPTY_CART);

/** Sanitized, read-only cart state. Invalid persisted data resolves to empty. */
export const $cart = computed($persistedCart, (persistedValue) => {
  const result = decodeCart(persistedValue);
  return result.ok ? result.value : EMPTY_CART;
});

/** Total units across all cart lines. */
export const $cartCount = computed($cart, (items) =>
  items.reduce((total, item) => total + item.quantity, 0),
);

/** Integer subtotal in the cart currency's smallest unit. */
export const $cartSubtotalMinor = computed($cart, (items) =>
  items.reduce(
    (total, item) =>
      total + item.unitPriceMinorSnapshot * item.quantity,
    0,
  ),
);

export const $cartCurrency = computed(
  $cart,
  (items) => items[0]?.currency ?? null,
);

export const $cartHasPendingPricing = computed($cart, (items) =>
  items.some(
    (item) =>
      item.verificationStatusSnapshot === "pending-clinic-confirmation",
  ),
);

function commitCart(items: readonly CartItem[]): void {
  const result = decodeCart(items);

  if (result.ok) {
    $persistedCart.set(result.value);
  }
}

export function addToCart(product: AddToCartInput): void {
  if (!isValidAddToCartInput(product)) {
    return;
  }

  const items = $cart.get();
  const existingItem = items.find((item) => item.productId === product.id);
  const currentCurrency = items[0]?.currency;

  if (currentCurrency !== undefined && currentCurrency !== product.currency) {
    return;
  }

  if (existingItem === undefined) {
    commitCart([
      ...items,
      {
        productId: product.id,
        quantity: 1,
        titleSnapshot: product.title,
        unitPriceMinorSnapshot: product.priceMinor,
        currency: product.currency,
        verificationStatusSnapshot: product.verificationStatus,
      },
    ]);
    return;
  }

  const nextQuantity = existingItem.quantity + 1;

  if (!Number.isSafeInteger(nextQuantity)) {
    return;
  }

  commitCart(
    items.map((item) =>
      item.productId === product.id
        ? {
            ...item,
            quantity: nextQuantity,
            titleSnapshot: product.title,
            unitPriceMinorSnapshot: product.priceMinor,
            currency: product.currency,
            verificationStatusSnapshot: product.verificationStatus,
          }
        : item,
    ),
  );
}

export function removeFromCart(productId: string): void {
  if (!isValidProductId(productId)) {
    return;
  }

  commitCart($cart.get().filter((item) => item.productId !== productId));
}

export function setCartItemQuantity(
  productId: string,
  quantity: number,
): void {
  if (!isValidProductId(productId) || !Number.isFinite(quantity)) {
    return;
  }

  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  if (!isPositiveSafeInteger(quantity)) {
    return;
  }

  const items = $cart.get();

  if (!items.some((item) => item.productId === productId)) {
    return;
  }

  commitCart(
    items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    ),
  );
}

export function clearCart(): void {
  $persistedCart.set(EMPTY_CART);
}
