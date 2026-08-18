export interface LiqPayPayload {
  readonly public_key: string;
  readonly version: "3";
  readonly action: "pay";
  readonly amount: number;
  readonly currency: "UAH";
  readonly description: string;
  readonly order_id: string;
  readonly result_url: string;
  readonly server_url: string;
  readonly sandbox?: 0 | 1;
}

export interface LiqPayCallbackData {
  readonly public_key: string;
  readonly action: string;
  readonly status:
    | "success"
    | "error"
    | "failure"
    | "reversed"
    | "subscribed"
    | "unsubscribed"
    | "processing"
    | "wait_accept"
    | "wait_card"
    | "wait_compensation"
    | "wait_secure";
  readonly order_id: string;
  readonly payment_id: number;
  readonly amount: number;
  readonly currency: string;
  readonly sender_phone?: string;
  readonly err_code?: string;
  readonly err_description?: string;
}

// Безпечне перетворення UTF-8 рядка в Base64 для Web Crypto / Workers
export function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Безпечне декодування Base64 у UTF-8 рядок
export function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Генерація SHA-1 Base64 підпису (LiqPay Protocol v3)
export async function createLiqPaySignature(
  dataBase64: string,
  privateKey: string
): Promise<string> {
  const text = privateKey + dataBase64 + privateKey;
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const bytes = new Uint8Array(hashBuffer);

  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function verifyLiqPaySignature(
  dataBase64: string,
  receivedSignature: string,
  privateKey: string
): Promise<boolean> {
  const expected = await createLiqPaySignature(dataBase64, privateKey);
  return expected === receivedSignature;
}

export function decodeLiqPayData(dataBase64: string): LiqPayCallbackData | null {
  try {
    const jsonStr = decodeBase64Utf8(dataBase64);
    return JSON.parse(jsonStr) as LiqPayCallbackData;
  } catch {
    return null;
  }
}
