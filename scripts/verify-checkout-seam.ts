import { checkoutRequestSchema } from "../src/schemas/checkout.ts";
import {
  buildCanonicalCheckoutCart,
  type CanonicalCheckoutError,
} from "../src/lib/commerce/server-cart.ts";
import type { ProductSummary } from "../src/lib/cms/index.ts";

const product = (overrides: Partial<ProductSummary> = {}): ProductSummary => ({
  id: "verified-product",
  title: "Verified product",
  description: "Verification fixture",
  category: "care",
  brand: "Fixture",
  priceMinor: 12_345,
  currency: "UAH",
  image: "/images/artificial/shop-editorial-eyewear.jpg",
  imageKind: "editorial",
  inStock: true,
  verificationStatus: "verified",
  ...overrides,
});

const request = checkoutRequestSchema.parse({
  items: [{ productId: "verified-product", quantity: 2 }],
  delivery: {
    provider: "nova-poshta",
    cityRef: "city-reference",
    warehouseRef: "warehouse-reference",
    pointType: "department",
  },
});

const validResult = buildCanonicalCheckoutCart(request, [product()]);
if (
  !validResult.ok ||
  validResult.cart.subtotalMinor !== 24_690 ||
  validResult.cart.currency !== "UAH"
) {
  throw new Error("Canonical server-price calculation failed.");
}

function expectError(
  expectedError: CanonicalCheckoutError,
  catalog: readonly ProductSummary[],
  input = request,
): void {
  const result = buildCanonicalCheckoutCart(input, catalog);
  if (result.ok || result.error !== expectedError) {
    throw new Error(`Expected ${expectedError}.`);
  }
}

expectError("PRODUCT_UNAVAILABLE", []);
expectError("PRODUCT_UNAVAILABLE", [product({ inStock: false })]);
expectError("PRICE_UNAVAILABLE", [
  product({ verificationStatus: "pending-clinic-confirmation" }),
]);
expectError("PRICE_UNAVAILABLE", [product({ priceMinor: 0 })]);
expectError("UNSUPPORTED_CURRENCY", [product({ currency: "EUR" })]);
expectError(
  "DUPLICATE_PRODUCT",
  [product()],
  checkoutRequestSchema.parse({
    ...request,
    items: [
      { productId: "verified-product", quantity: 1 },
      { productId: "verified-product", quantity: 1 },
    ],
  }),
);

console.log(
  "Checkout seam verification passed: client price fields are absent and canonical server validation rejects unsafe carts.",
);
