import type { APIRoute } from "astro";

import { dispatchAppointment } from "../../lib/leads/dispatcher";
import { appointmentSchema } from "../../schemas/appointment";

export const prerender = false;

const MAX_BODY_BYTES = 4_096;

type AppointmentApiResponse =
  | { ok: true }
  | {
      ok: false;
      error:
        | "INVALID_INPUT"
        | "INVALID_ORIGIN"
        | "PAYLOAD_TOO_LARGE"
        | "UPSTREAM_ERROR";
    };

function jsonResponse(
  body: AppointmentApiResponse,
  status: 200 | 400 | 403 | 413 | 502,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function invalidInput(): Response {
  return jsonResponse({ ok: false, error: "INVALID_INPUT" }, 400);
}

function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return body + decoder.decode();
      }

      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_BODY_BYTES) {
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
    return invalidInput();
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let body: unknown;

  try {
    const rawBody = await readBoundedBody(request);

    if (rawBody === null) {
      return jsonResponse({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
    }

    body = JSON.parse(rawBody) as unknown;
  } catch {
    return invalidInput();
  }

  const result = appointmentSchema.safeParse(body);

  if (!result.success) {
    return invalidInput();
  }

  try {
    await dispatchAppointment(result.data);
  } catch {
    return jsonResponse({ ok: false, error: "UPSTREAM_ERROR" }, 502);
  }

  return jsonResponse({ ok: true }, 200);
};
