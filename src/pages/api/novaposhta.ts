import type { APIRoute } from "astro";
import { novaPoshtaQuerySchema } from "../../schemas/checkout";

export const prerender = false;

const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

export const POST: APIRoute = async ({ request, locals }) => {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, unknown> } })?.runtime?.env;
  const apiKey = (runtimeEnv?.NOVA_POSHTA_API_KEY as string | undefined) ?? import.meta.env.NOVA_POSHTA_API_KEY;

  if (!apiKey) {
    return Response.json(
      { ok: false, error: "Сервіс доставки тимчасово недоступний (відсутній ключ API)" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Некоректний JSON" }, { status: 400 });
  }

  const parsed = novaPoshtaQuerySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Некоректні параметри запиту" }, { status: 400 });
  }

  const { action, query, cityRef } = parsed.data;

  try {
    if (action === "searchSettlements") {
      const sanitizedQuery = (query || "").trim().slice(0, 100);
      if (sanitizedQuery.length < 2) {
        return Response.json({ ok: true, items: [] });
      }

      const response = await fetch(NP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          modelName: "Address",
          calledMethod: "searchSettlements",
          methodProperties: {
            CityName: sanitizedQuery,
            Limit: "10",
            Page: "1",
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        return Response.json({ ok: false, error: "Помилка звʼязку з Новою Поштою" }, { status: 502 });
      }

      const data = (await response.json()) as {
        success: boolean;
        data?: Array<{ Addresses?: Array<{ Present: string; DeliveryCity: string }> }>;
      };

      if (!data.success || !Array.isArray(data.data)) {
        return Response.json({ ok: true, items: [] });
      }

      const items = (data.data[0]?.Addresses || []).map((addr) => ({
        label: addr.Present,
        ref: addr.DeliveryCity,
      }));

      return Response.json({ ok: true, items });
    }

    if (action === "getWarehouses") {
      const sanitizedCityRef = (cityRef || "").trim();
      if (!sanitizedCityRef || sanitizedCityRef.length > 64) {
        return Response.json({ ok: false, error: "Некоректний ідентифікатор міста" }, { status: 400 });
      }

      const response = await fetch(NP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          modelName: "Address",
          calledMethod: "getWarehouses",
          methodProperties: {
            CityRef: sanitizedCityRef,
            Limit: "100",
            Page: "1",
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        return Response.json({ ok: false, error: "Помилка звʼязку з Новою Поштою" }, { status: 502 });
      }

      const data = (await response.json()) as {
        success: boolean;
        data?: Array<{ Description: string; Ref: string; Number: string }>;
      };

      if (!data.success || !Array.isArray(data.data)) {
        return Response.json({ ok: true, items: [] });
      }

      const items = data.data.map((wh) => ({
        label: wh.Description,
        ref: wh.Ref,
        number: wh.Number,
      }));

      return Response.json(
        { ok: true, items },
        {
          headers: {
            "Cache-Control": "private, max-age=300",
          },
        }
      );
    }

    return Response.json({ ok: false, error: "Невідома дія" }, { status: 400 });
  } catch {
    return Response.json({ ok: false, error: "Таймаут або збій запиту до Нової Пошти" }, { status: 504 });
  }
};
