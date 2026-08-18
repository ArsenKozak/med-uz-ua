export interface CommerceConfig {
  readonly publicKey: string;
  readonly privateKey: string;
  readonly isSandbox: boolean;
  readonly siteUrl: string;
  readonly botToken?: string;
  readonly chatId?: string;
}

export function getCommerceConfig(locals?: unknown): CommerceConfig {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
  const env = runtimeEnv ?? (typeof process !== "undefined" ? process.env : {});

  const publicKey = env.LIQPAY_PUBLIC_KEY;
  const privateKey = env.LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("CONFIG_FATAL: LIQPAY_PUBLIC_KEY or LIQPAY_PRIVATE_KEY is missing");
  }

  if (env.LIQPAY_SANDBOX !== "0" && env.LIQPAY_SANDBOX !== "1") {
    throw new Error("CONFIG_FATAL: LIQPAY_SANDBOX must be explicitly '0' or '1'");
  }

  return {
    publicKey,
    privateKey,
    isSandbox: env.LIQPAY_SANDBOX === "1",
    siteUrl: env.PUBLIC_SITE_URL || "http://localhost:4321",
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
  };
}

export const getLiqPayConfig = getCommerceConfig;
