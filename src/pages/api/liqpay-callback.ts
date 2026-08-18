import type { APIRoute } from "astro";
import { decodeLiqPayData, verifyLiqPaySignature } from "../../lib/commerce/liqpay";
import { getOrderById, atomicTransitionOrderStatus, markOrderPaidNotified } from "../../lib/commerce/orders";
import { notifyOrderPaid } from "../../lib/commerce/notifications";
import { getCommerceConfig } from "../../lib/commerce/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const config = getCommerceConfig(locals);

  const formData = await request.formData();
  const data = formData.get("data") as string | null;
  const signature = formData.get("signature") as string | null;

  if (!data || !signature) {
    return new Response("Missing parameters", { status: 400 });
  }

  const isValidSig = await verifyLiqPaySignature(data, signature, config.privateKey);
  if (!isValidSig) {
    return new Response("Invalid signature", { status: 403 });
  }

  const payment = decodeLiqPayData(data);
  if (!payment || payment.public_key !== config.publicKey || payment.action !== "pay") {
    return new Response("Invalid payload", { status: 400 });
  }

  const runtimeEnv = (locals as { runtime?: { env?: Record<string, unknown> } })?.runtime?.env;
  const storeContext = { env: runtimeEnv as { DB?: D1Database; med_uz_ua_db?: D1Database } };

  const order = await getOrderById(payment.order_id, storeContext);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  const receivedMinor = Math.round(payment.amount * 100);
  if (receivedMinor !== order.totalMinor || payment.currency !== order.currency) {
    return new Response("Amount/currency mismatch", { status: 422 });
  }

  const paymentDetails = {
    paymentProvider: "liqpay" as const,
    paymentId: String(payment.payment_id),
  };

  if (payment.status === "success") {
    const changed = await atomicTransitionOrderStatus(
      order.id,
      "PAID",
      ["AWAITING_PAYMENT", "PAYMENT_FAILED"],
      paymentDetails,
      storeContext
    );

    if (changed && config.botToken && config.chatId) {
      const updatedOrder = { ...order, status: "PAID" as const, paymentId: paymentDetails.paymentId };
      const sent = await notifyOrderPaid(updatedOrder, config.botToken, config.chatId);
      if (sent) {
        await markOrderPaidNotified(order.id, storeContext);
      }
    }
  } else if (payment.status === "reversed") {
    await atomicTransitionOrderStatus(order.id, "REVERSED", ["PAID"], paymentDetails, storeContext);
  } else if (payment.status === "failure" || payment.status === "error") {
    await atomicTransitionOrderStatus(order.id, "PAYMENT_FAILED", ["AWAITING_PAYMENT"], paymentDetails, storeContext);
  }

  return new Response("OK", { status: 200 });
};
