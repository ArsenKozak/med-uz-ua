import type { AppointmentInput } from "../../schemas/appointment";

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface LeadDispatchEnvironment {
  readonly LEAD_API_URL?: string;
  readonly LEAD_API_TOKEN?: string;
}

export type AppointmentDispatcher = (
  appointment: AppointmentInput,
) => Promise<void>;

function readDispatchConfig(
  environment: LeadDispatchEnvironment,
): { endpoint: URL; token: string } | null {
  const rawEndpoint = environment.LEAD_API_URL?.trim();
  const token = environment.LEAD_API_TOKEN?.trim();

  if (!rawEndpoint || !token) {
    return null;
  }

  try {
    const endpoint = new URL(rawEndpoint);

    if (
      endpoint.protocol !== "https:" ||
      endpoint.username !== "" ||
      endpoint.password !== "" ||
      endpoint.hash !== ""
    ) {
      return null;
    }

    return { endpoint, token };
  } catch {
    return null;
  }
}

/**
 * Creates the production lead-delivery boundary from server-only bindings.
 * Missing or unsafe configuration fails closed so the UI cannot report a
 * successful appointment that was never delivered.
 */
export function createLeadDispatcher(
  environment: LeadDispatchEnvironment,
  fetcher: Fetcher = fetch,
): AppointmentDispatcher {
  return async (appointment) => {
    const config = readDispatchConfig(environment);

    if (config === null) {
      throw new Error("LEAD_DISPATCH_UNAVAILABLE");
    }

    const response = await fetcher(config.endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(appointment),
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error("LEAD_DISPATCH_FAILED");
    }
  };
}
