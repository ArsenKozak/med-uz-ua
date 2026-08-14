export const ANALYTICS_CONSENT_STORAGE_KEY =
  "meduzua:analytics-consent:v2";
export const ANALYTICS_CONSENT_POLICY_VERSION = 2;

const LEGACY_ANALYTICS_CONSENT_STORAGE_KEY =
  "meduzua:analytics-consent:v1";

export type AnalyticsConsent = "granted" | "denied";
export type AnalyticsLocale = "uk" | "sk" | "en" | "hu";
export type PhonePlacement =
  | "header"
  | "mobile_action_bar"
  | "footer"
  | "content";

export interface ConsentState {
  readonly analytics: boolean;
  readonly advertising: boolean;
  readonly version: number;
  readonly updatedAt: string;
}

export interface ConsentPreferences {
  readonly analytics: boolean;
  readonly advertising: boolean;
}

export interface GoogleConsentState {
  readonly analytics_storage: AnalyticsConsent;
  readonly ad_storage: AnalyticsConsent;
  readonly ad_user_data: AnalyticsConsent;
  readonly ad_personalization: AnalyticsConsent;
}

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

const DEFAULT_GOOGLE_CONSENT: GoogleConsentState = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

const ANALYTICS_STORAGE_PREFIXES = ["_ga", "_gid", "_gat"] as const;
const ADVERTISING_STORAGE_PREFIXES = ["_gcl", "_gac"] as const;
const SAFE_ITEM_DIMENSION = /^[a-z0-9][a-z0-9._:-]{0,79}$/i;

let inMemoryConsentState: ConsentState | null = null;
const currentTaskEventSignatures = new Set<string>();

function isAnalyticsLocale(value: string): value is AnalyticsLocale {
  return value === "uk" || value === "sk" || value === "en" || value === "hu";
}

function isConsentState(value: unknown): value is ConsentState {
  if (typeof value !== "object" || value === null) return false;
  if (!("analytics" in value) || typeof value.analytics !== "boolean") {
    return false;
  }
  if (!("advertising" in value) || typeof value.advertising !== "boolean") {
    return false;
  }
  if (!("version" in value) || value.version !== ANALYTICS_CONSENT_POLICY_VERSION) {
    return false;
  }
  if (!("updatedAt" in value) || typeof value.updatedAt !== "string") {
    return false;
  }

  return Number.isFinite(Date.parse(value.updatedAt));
}

function removeStoredValue(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Storage can be unavailable in privacy modes. Consent stays denied safely.
  }
}

function readStoredConsentState(): ConsentState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (isConsentState(parsed)) return parsed;

    removeStoredValue(window.localStorage, ANALYTICS_CONSENT_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

function clearLegacyConsentState(): void {
  if (typeof window === "undefined") return;
  removeStoredValue(window.localStorage, LEGACY_ANALYTICS_CONSENT_STORAGE_KEY);
}

export function getConsentState(): ConsentState | null {
  if (typeof window === "undefined") return null;

  clearLegacyConsentState();
  return readStoredConsentState() ?? inMemoryConsentState;
}

export function synchronizeConsentStateFromStorage(): ConsentState | null {
  if (typeof window === "undefined") return null;
  inMemoryConsentState = readStoredConsentState();
  return inMemoryConsentState;
}

export function setConsentPreferences(
  preferences: ConsentPreferences,
  updatedAt = new Date(),
): ConsentState {
  const state: ConsentState = {
    analytics: preferences.analytics,
    advertising: preferences.advertising,
    version: ANALYTICS_CONSENT_POLICY_VERSION,
    updatedAt: updatedAt.toISOString(),
  };

  inMemoryConsentState = state;
  if (typeof window === "undefined") return state;

  clearLegacyConsentState();
  try {
    window.localStorage.setItem(
      ANALYTICS_CONSENT_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // The current page still honors the in-memory choice. A later page load
    // safely returns to the unset/denied state when storage is unavailable.
  }

  return state;
}

/** Compatibility helper for existing integrations that only know analytics. */
export function getAnalyticsConsent(): AnalyticsConsent | null {
  const state = getConsentState();
  if (state === null) return null;
  return state.analytics ? "granted" : "denied";
}

/** Compatibility helper; advertising remains denied for a binary choice. */
export function setAnalyticsConsent(consent: AnalyticsConsent): void {
  setConsentPreferences({
    analytics: consent === "granted",
    advertising: false,
  });
}

export function googleConsentFromState(
  state: ConsentState | null,
): GoogleConsentState {
  if (state === null) return DEFAULT_GOOGLE_CONSENT;

  const analytics: AnalyticsConsent = state.analytics ? "granted" : "denied";
  const advertising: AnalyticsConsent = state.advertising
    ? "granted"
    : "denied";
  return {
    analytics_storage: analytics,
    ad_storage: advertising,
    ad_user_data: advertising,
    ad_personalization: advertising,
  };
}

function ensureDataLayer(): void {
  window.dataLayer ??= [];
}

function pushGoogleConsentCommand(
  command: "default" | "update",
  consent: GoogleConsentState,
): void {
  ensureDataLayer();

  function gtag(
    _scope: "consent",
    _command: "default" | "update",
    _consent: GoogleConsentState,
  ): void {
    window.dataLayer.push(arguments);
  }

  gtag("consent", command, consent);
}

export function initializeGoogleConsentDefaults(): void {
  if (typeof window === "undefined") return;
  if (document.documentElement.dataset.googleConsentDefaults === "true") {
    return;
  }

  document.documentElement.dataset.googleConsentDefaults = "true";
  pushGoogleConsentCommand("default", DEFAULT_GOOGLE_CONSENT);
}

export function updateGoogleConsent(state: ConsentState | null): void {
  if (typeof window === "undefined") return;
  initializeGoogleConsentDefaults();
  pushGoogleConsentCommand("update", googleConsentFromState(state));
}

export function shouldLoadGoogleScripts(state: ConsentState | null): boolean {
  return state !== null && (state.analytics || state.advertising);
}

function storageKeyMatches(key: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}_`));
}

function clearMatchingStorage(
  storage: Storage,
  prefixes: readonly string[],
): void {
  try {
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index),
    ).filter((key): key is string => key !== null);

    for (const key of keys) {
      if (storageKeyMatches(key, prefixes)) storage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable; the consent gate still blocks future events.
  }
}

function cookieDomains(): readonly string[] {
  const hostname = window.location.hostname;
  if (
    hostname.length === 0 ||
    hostname === "localhost" ||
    /^[\d.]+$/.test(hostname) ||
    hostname.includes(":")
  ) {
    return [];
  }

  const labels = hostname.split(".");
  const domains = [hostname];
  if (labels.length > 3) domains.push(labels.slice(1).join("."));
  return domains;
}

function clearMatchingCookies(prefixes: readonly string[]): void {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=", 1)[0]?.trim() ?? "")
    .filter(
      (name) => name.length > 0 && storageKeyMatches(name, prefixes),
    );

  for (const name of cookieNames) {
    const encodedName = encodeURIComponent(name);
    document.cookie = `${encodedName}=; Max-Age=0; Path=/; SameSite=Lax`;
    for (const domain of cookieDomains()) {
      document.cookie = `${encodedName}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`;
      document.cookie = `${encodedName}=; Max-Age=0; Path=/; Domain=.${domain}; SameSite=Lax`;
    }
  }
}

export function clearSiteOwnedGoogleStorage(input: {
  readonly analytics: boolean;
  readonly advertising: boolean;
}): void {
  if (typeof window === "undefined") return;

  const prefixes = [
    ...(input.analytics ? ANALYTICS_STORAGE_PREFIXES : []),
    ...(input.advertising ? ADVERTISING_STORAGE_PREFIXES : []),
  ];
  if (prefixes.length === 0) return;

  clearMatchingStorage(window.localStorage, prefixes);
  clearMatchingStorage(window.sessionStorage, prefixes);
  clearMatchingCookies(prefixes);
}

function sanitizedEvent(event: AnalyticsEvent): AnalyticsEvent | null {
  switch (event.event) {
    case "phone_click":
      return {
        event: event.event,
        placement: event.placement,
        page_path: event.page_path,
        locale: event.locale,
      };
    case "appointment_submit_success":
      return {
        event: event.event,
        page_path: event.page_path,
        locale: event.locale,
      };
    case "appointment_submit_error":
      return {
        event: event.event,
        error_code: event.error_code,
        page_path: event.page_path,
        locale: event.locale,
      };
    case "view_item":
    case "add_to_cart": {
      const item = event.items[0];
      if (
        !SAFE_ITEM_DIMENSION.test(item.item_id) ||
        !SAFE_ITEM_DIMENSION.test(item.item_category) ||
        !Number.isFinite(event.value) ||
        event.value < 0 ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return null;
      }
      return {
        event: event.event,
        currency: "UAH",
        value: event.value,
        items: [
          {
            item_id: item.item_id,
            item_category: item.item_category,
            price: item.price,
            quantity: item.quantity,
          },
        ],
      };
    }
    case "view_cart":
      if (
        !Number.isInteger(event.item_count) ||
        event.item_count < 0 ||
        (event.value !== null &&
          (!Number.isFinite(event.value) || event.value < 0))
      ) {
        return null;
      }
      return {
        event: event.event,
        currency: event.currency,
        value: event.value,
        item_count: event.item_count,
      };
  }
}

export function track(event: AnalyticsEvent): boolean {
  if (typeof window === "undefined" || getConsentState()?.analytics !== true) {
    return false;
  }

  const payload = sanitizedEvent(event);
  if (payload === null) return false;

  const signature = JSON.stringify(payload);
  if (currentTaskEventSignatures.has(signature)) return false;
  currentTaskEventSignatures.add(signature);
  queueMicrotask(() => currentTaskEventSignatures.delete(signature));

  ensureDataLayer();
  window.dataLayer.push(payload);
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
