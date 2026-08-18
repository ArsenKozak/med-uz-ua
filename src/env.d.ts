/// <reference path="../.astro/types.d.ts" />

type D1Database = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(colName?: string): Promise<T | null>;
      all<T = unknown>(): Promise<{ results?: T[]; success: boolean; meta?: Record<string, unknown> }>;
      run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
    };
  };
  exec(query: string): Promise<unknown>;
  batch<T = unknown>(statements: unknown[]): Promise<T[]>;
};

type KVNamespace = {
  get(key: string, type?: "text" | "json" | "arrayBuffer" | "stream"): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

interface ImportMetaEnv {
  readonly LIQPAY_PUBLIC_KEY?: string;
  readonly LIQPAY_PRIVATE_KEY?: string;
  readonly LIQPAY_SANDBOX?: string;
  readonly NOVA_POSHTA_API_KEY?: string;
  readonly TELEGRAM_BOT_TOKEN?: string;
  readonly TELEGRAM_CHAT_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
