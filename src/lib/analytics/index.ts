export type AnalyticsEvent = Record<string, unknown> & {
  event: string;
};

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer ??= [];
  window.dataLayer.push(event);
}

export function trackAppointmentSuccess(): void {
  track({ event: "appointment_success" });
}
