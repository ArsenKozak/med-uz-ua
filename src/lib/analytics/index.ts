export const ANALYTICS_CONSENT_STORAGE_KEY = "meduzua:analytics-consent:v1";

export type AnalyticsConsent = "granted" | "denied";
export type AnalyticsLocale = "uk" | "sk" | "en" | "hu";
export type PhonePlacement =
  | "header"
  | "mobile_action_bar"
  | "footer"
  | "content";

export interface AnalyticsItem {
  readonly item_id: string;
  readonly item_category: string;
  readonly price: number;
  readonly quantity: number;
}

export type AnalyticsEvent =
  | {
      readonly event: "phone_click";
      readonly placement: PhonePlacement;
      readonly page_path: string;
      readonly locale: AnalyticsLocale;
    }
  | {
      readonly event: "appointment_submit_success";
      readonly page_path: string;
      readonly locale: AnalyticsLocale;
    }
  | {
      readonly event: "appointment_submit_error";
      readonly error_code:
        | "invalid_input"
        | "request_failed"
        | "upstream_error";
      readonly page_path: string;
      readonly locale: AnalyticsLocale;
    }
  | {
      readonly event: "view_item" | "add_to_cart";
      readonly currency: "UAH";
      readonly value: number;
      readonly items: readonly [AnalyticsItem];
    }
  | {
      readonly event: "view_cart";
      readonly currency: "UAH" | null;
      readonly value: number | null;
      readonly item_count: number;
    };

function isAnalyticsLocale(value: string): value is AnalyticsLocale {
  return value === "uk" || value === "sk" || value === "en" || value === "hu";
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(consent: AnalyticsConsent): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage may be unavailable. The caller keeps analytics disabled safely.
  }
}

export function track(event: AnalyticsEvent): boolean {
  if (typeof window === "undefined" || getAnalyticsConsent() !== "granted") {
    return false;
  }

  window.dataLayer ??= [];
  window.dataLayer.push(event);
  return true;
}

function currentContext(): {
  readonly pagePath: string;
  readonly locale: AnalyticsLocale;
} {
  const documentLocale = document.documentElement.lang;
  return {
    pagePath: window.location.pathname,
    locale: isAnalyticsLocale(documentLocale) ? documentLocale : "uk",
  };
}

export function trackPhoneClick(placement: PhonePlacement): boolean {
  const { pagePath, locale } = currentContext();
  return track({
    event: "phone_click",
    placement,
    page_path: pagePath,
    locale,
  });
}

export function trackAppointmentSuccess(): boolean {
  const { pagePath, locale } = currentContext();
  return track({
    event: "appointment_submit_success",
    page_path: pagePath,
    locale,
  });
}

export function trackAppointmentError(
  errorCode: "invalid_input" | "request_failed" | "upstream_error",
): boolean {
  const { pagePath, locale } = currentContext();
  return track({
    event: "appointment_submit_error",
    error_code: errorCode,
    page_path: pagePath,
    locale,
  });
}

export function trackAddToCart(input: {
  readonly id: string;
  readonly category: string;
  readonly priceMinor: number;
  readonly quantity?: number;
}): boolean {
  const quantity = input.quantity ?? 1;
  return track({
    event: "add_to_cart",
    currency: "UAH",
    value: (input.priceMinor * quantity) / 100,
    items: [
      {
        item_id: input.id,
        item_category: input.category,
        price: input.priceMinor / 100,
        quantity,
      },
    ],
  });
}

export function trackViewCart(input: {
  readonly subtotalMinor: number | null;
  readonly currency: string | null;
  readonly itemCount: number;
}): boolean {
  return track({
    event: "view_cart",
    currency: input.currency === "UAH" ? "UAH" : null,
    value: input.subtotalMinor === null ? null : input.subtotalMinor / 100,
    item_count: input.itemCount,
  });
}
