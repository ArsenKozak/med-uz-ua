import type { AppointmentInput } from "../../schemas/appointment";

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const mockTelegramFetch: Fetcher = async () =>
  Response.json({ ok: true }, { status: 200 });

/**
 * Stage 1 downstream boundary. The injected fetch mock keeps the tracer bullet
 * deterministic while preserving the same awaited failure semantics as the
 * eventual Telegram, CRM, or email adapter.
 */
export async function dispatchAppointment(
  appointment: AppointmentInput,
  fetcher: Fetcher = mockTelegramFetch,
): Promise<void> {
  const response = await fetcher("https://api.telegram.invalid/mock/sendMessage", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(appointment),
  });

  if (!response.ok) {
    throw new Error("LEAD_DISPATCH_FAILED");
  }
}
