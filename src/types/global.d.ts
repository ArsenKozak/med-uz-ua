import type { Runtime } from "@astrojs/cloudflare";

interface CloudflareEnvironment {
  readonly LEAD_API_URL?: string;
  readonly LEAD_API_TOKEN?: string;
}

declare global {
  namespace App {
    interface Locals extends Runtime<CloudflareEnvironment> {}
  }

  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

export {};
