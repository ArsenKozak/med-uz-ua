import type { APIRoute } from "astro";

import { getAllActiveProducts } from "../../lib/cms";
import { buildCanonicalCheckoutCart } from "../../lib/commerce/server-cart";
import { checkoutRequestSchema } from "../../schemas/checkout";

export const prerender = false;

const MAX_BODY_BYTES = 12_288;

type CheckoutApiResponse =
  | {
      readonly ok: false;
      readonly error:
        | "INVALID_INPUT"
        | "INVALID_ORIGIN"
        | "PAYLOAD_TOO_LARGE"
        | "CART_REJECTED"
        | "CHECKOUT_UNAVAILABLE";
    };

function jsonResponse(
  body: CheckoutApiResponse,
  status: 400 | 403 | 413 | 422 | 503,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (request.body === null) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let byteCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) return body + decoder.decode();

      byteCount += value.byteLength;
      if (byteCount > MAX_BODY_BYTES) {
        await reader.cancel("Request body exceeds the configured limit");
        return null;
      }

      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasValidOrigin(request)) {
    return jsonResponse({ ok: false, error: "INVALID_ORIGIN" }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let rawInput: unknown;

  try {
    const rawBody = await readBoundedBody(request);
    if (rawBody === null) {
      return jsonResponse({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
    }
    rawInput = JSON.parse(rawBody) as unknown;
  } catch {
    return jsonResponse({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  const parsedRequest = checkoutRequestSchema.safeParse(rawInput);
  if (!parsedRequest.success) {
    return jsonResponse({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  const products = await getAllActiveProducts();
  const canonicalCart = buildCanonicalCheckoutCart(
    parsedRequest.data,
    products,
  );

  if (!canonicalCart.ok) {
    return jsonResponse({ ok: false, error: "CART_REJECTED" }, 422);
  }

  // A canonical cart is deliberately not enough to create a payment. Until a
  // dedicated durable order store, deployed secrets, Nova Poshta revalidation,
  // and version-specific LiqPay callback verification are proven, no order ID,
  // signature, payment URL, or success state is produced.
  return jsonResponse({ ok: false, error: "CHECKOUT_UNAVAILABLE" }, 503);
};
