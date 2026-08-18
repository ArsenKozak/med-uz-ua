import type { APIRoute } from "astro";
import { getOrderById } from "../../../../lib/commerce/orders";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return Response.json({ ok: false, error: "ID обов'язковий" }, { status: 400 });
  }

  const runtimeEnv = (locals as unknown as { runtime?: { env?: Record<string, unknown> } })?.runtime?.env;
  const storeContext = { env: runtimeEnv as { DB?: D1Database; med_uz_ua_db?: D1Database } };

  const order = await getOrderById(id, storeContext);
  if (!order) {
    return Response.json({ ok: false, error: "Замовлення не знайдено" }, { status: 404 });
  }

  return Response.json(
    {
      ok: true,
      orderNumber: order.orderNumber,
      status: order.status,
      totalMinor: order.totalMinor,
      currency: order.currency,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
};
