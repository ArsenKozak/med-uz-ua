import type { APIRoute } from "astro";
import { getAllActiveProducts } from "../../lib/cms";
import { checkoutRequestSchema } from "../../schemas/checkout";
import { createOrder, generateOrderNumber } from "../../lib/commerce/orders";
import { createLiqPaySignature, encodeBase64Utf8, type LiqPayPayload } from "../../lib/commerce/liqpay";
import { getCommerceConfig } from "../../lib/commerce/config";
import type { OrderItemRecord, OrderRecord } from "../../types/order";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  let rawInput: unknown;
  try {
    rawInput = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Некоректний JSON" }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Помилка валідації даних", issues: parsed.error.issues }, { status: 400 });
  }

  const { customer, items, delivery } = parsed.data;
  const allProducts = await getAllActiveProducts();
  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  let totalMinor = 0;
  const orderItems: OrderItemRecord[] = [];

  for (const item of items) {
    const canonical = productMap.get(item.productId);
    if (!canonical || !canonical.inStock) {
      return Response.json({ ok: false, error: `Товар ${item.productId} недоступний` }, { status: 422 });
    }

    const lineTotalMinor = canonical.priceMinor * item.quantity;
    totalMinor += lineTotalMinor;

    orderItems.push({
      productId: canonical.id,
      title: canonical.title,
      unitPriceMinor: canonical.priceMinor,
      quantity: item.quantity,
      lineTotalMinor,
      currency: canonical.currency,
    });
  }

  const { id, orderNumber } = generateOrderNumber();
  const now = new Date().toISOString();

  const orderRecord: OrderRecord = {
    id,
    orderNumber,
    createdAt: now,
    updatedAt: now,
    status: "AWAITING_PAYMENT",
    totalMinor,
    currency: "UAH",
    customer,
    delivery,
    items: orderItems,
  };

  const runtimeEnv = (locals as { runtime?: { env?: Record<string, unknown> } })?.runtime?.env;
  const storeContext = { env: runtimeEnv as { DB?: D1Database; med_uz_ua_db?: D1Database } };

  try {
    await createOrder(orderRecord, storeContext);
  } catch (err) {
    console.error("[Checkout D1 Error]:", err);
    return Response.json({ ok: false, error: "Помилка збереження замовлення" }, { status: 500 });
  }

  const config = getCommerceConfig(locals);
  const totalUah = totalMinor / 100;

  const liqpayPayload: LiqPayPayload = {
    public_key: config.publicKey,
    version: "3",
    action: "pay",
    amount: totalUah,
    currency: "UAH",
    description: `Оплата замовлення ${orderNumber} — European Clinic`,
    order_id: id,
    result_url: `${config.siteUrl}/checkout?order=${id}&payment=return`,
    server_url: `${config.siteUrl}/api/liqpay-callback`,
    sandbox: config.isSandbox ? 1 : 0,
  };

  const dataBase64 = encodeBase64Utf8(JSON.stringify(liqpayPayload));
  const signature = await createLiqPaySignature(dataBase64, config.privateKey);

  return Response.json({
    ok: true,
    orderId: id,
    orderNumber,
    mode: "liqpay",
    data: dataBase64,
    signature,
    checkoutUrl: "https://www.liqpay.ua/api/3/checkout",
  });
};
