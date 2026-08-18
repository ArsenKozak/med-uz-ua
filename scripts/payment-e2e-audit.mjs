import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const REQUEST_TIMEOUT_MS = 8_000;

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(message) {
  passed++;
  console.log(`  ✅ ${message}`);
}

function fail(message, details) {
  failed++;
  console.error(`  ❌ ${message}`);
  if (details !== undefined) {
    console.error("     ", details);
  }
}

function warn(message) {
  warnings++;
  console.warn(`  ⚠️  ${message}`);
}

function section(title) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`🧪 ${title}`);
  console.log(`${"═".repeat(72)}`);
}

function assert(condition, message, details) {
  if (condition) {
    pass(message);
    return true;
  }

  fail(message, details);
  return false;
}

/* -------------------------------------------------------------------------- */
/* ENV                                                                         */
/* -------------------------------------------------------------------------- */

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};

  const result = {};

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const equals = line.indexOf("=");
    if (equals <= 0) continue;

    const key = line.slice(0, equals).trim();

    let value = line.slice(equals + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

const env = {
  ...parseEnvFile(".env"),
  ...parseEnvFile(".dev.vars"),
  ...process.env,
};

const PUBLIC_KEY = env.LIQPAY_PUBLIC_KEY;
const PRIVATE_KEY = env.LIQPAY_PRIVATE_KEY;

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error(
    "❌ LIQPAY_PUBLIC_KEY / LIQPAY_PRIVATE_KEY відсутні. " +
      "Audit має використовувати ті самі sandbox-ключі, що й dev server.",
  );
  process.exit(2);
}

if (env.LIQPAY_SANDBOX !== "1") {
  console.error(
    "❌ LIQPAY_SANDBOX != 1. Я відмовляюсь запускати adversarial payment audit не в sandbox.",
  );
  process.exit(2);
}

if (env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_CHAT_ID) {
  warn(
    "Telegram credentials присутні. Successful callback може створити реальне тестове повідомлення.",
  );
}

/* -------------------------------------------------------------------------- */
/* HTTP                                                                        */
/* -------------------------------------------------------------------------- */

async function request(urlPath, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout ?? REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(new URL(urlPath, BASE_URL), {
      method: options.method ?? "GET",
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
      redirect: "manual",
    });

    const raw = await response.text();

    let body = raw;

    try {
      body = JSON.parse(raw);
    } catch {
      // plain text is valid for callback endpoint
    }

    return {
      status: response.status,
      headers: response.headers,
      raw,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function jsonPost(url, payload) {
  return request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/* -------------------------------------------------------------------------- */
/* LIQPAY                                                                      */
/* -------------------------------------------------------------------------- */

function createSignature(dataBase64) {
  return crypto
    .createHash("sha1")
    .update(PRIVATE_KEY + dataBase64 + PRIVATE_KEY)
    .digest("base64");
}

function verifySignature(dataBase64, signature) {
  const expected = createSignature(dataBase64);

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature ?? ""));

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function encodeCallback(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function decodeUtf8Base64(base64) {
  return Buffer.from(base64, "base64").toString("utf8");
}

async function callback(data, signature = createSignature(data)) {
  const body = new URLSearchParams({
    data,
    signature,
  });

  return request("/api/liqpay-callback", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
}

/* -------------------------------------------------------------------------- */
/* CATALOG                                                                     */
/* -------------------------------------------------------------------------- */

function findTestProduct() {
  const productsDir = "src/content/products";

  if (!fs.existsSync(productsDir)) {
    throw new Error(`Каталог ${productsDir} не існує.`);
  }

  for (const file of fs
    .readdirSync(productsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()) {
    const fullPath = path.join(productsDir, file);
    const product = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    if (product.status === "active" && product.inStock === true) {
      return {
        id: product.id ?? path.parse(file).name,
        file,
        priceMinor: product.priceMinor,
        currency: product.currency,
        title: product.title,
      };
    }
  }

  throw new Error("Не знайдено active + inStock продукту.");
}

/* -------------------------------------------------------------------------- */
/* ORDERS                                                                      */
/* -------------------------------------------------------------------------- */

const DELIVERY = {
  provider: "nova-poshta",
  cityName: "м. Ужгород",
  cityRef: "db5c88e0-391c-11dd-90d9-001a92567626",
  warehouseName: "Відділення №1: тестове відділення",
  warehouseRef: "16ca2181-e1c2-11e3-8c4a-0050568002cf",
};

function makeCheckoutPayload(product, overrides = {}) {
  return {
    customer: {
      fullName: "Тест Тестович",
      phone: "+380991234567",
      comment: `E2E audit ${Date.now()}`,
    },
    items: [
      {
        productId: product.id,
        quantity: 1,
      },
    ],
    delivery: DELIVERY,
    ...overrides,
  };
}

async function createTestOrder(product) {
  const response = await jsonPost(
    "/api/checkout",
    makeCheckoutPayload(product),
  );

  if (
    response.status !== 200 ||
    typeof response.body !== "object" ||
    response.body === null ||
    response.body.ok !== true
  ) {
    throw new Error(
      `Checkout failed: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
}

async function getStatus(orderId) {
  return request(`/api/orders/${encodeURIComponent(orderId)}/status`);
}

function makeCallbackPayload(orderId, totalMinor, overrides = {}) {
  return {
    public_key: PUBLIC_KEY,
    action: "pay",
    status: "success",
    order_id: orderId,
    payment_id: crypto.randomInt(100_000_000, 999_999_999),
    amount: totalMinor / 100,
    currency: "UAH",
    sender_phone: "+380991234567",
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* TESTS                                                                       */
/* -------------------------------------------------------------------------- */

async function run() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║        MED.UZ.UA — ADVERSARIAL PAYMENT E2E / STATE AUDIT            ║
╚══════════════════════════════════════════════════════════════════════╝

Target: ${BASE_URL}
Sandbox: ${env.LIQPAY_SANDBOX}
`);

  /* ---------------------------------------------------------------------- */
  section("0. Preflight");

  try {
    const health = await request("/");
    assert(
      health.status < 500,
      `Dev server відповідає (${health.status})`,
      health.raw.slice(0, 200),
    );
  } catch (error) {
    fail("Dev server недоступний", error);
    throw error;
  }

  const product = findTestProduct();

  pass(
    `Test SKU: ${product.id} (${product.title ?? product.file}, ${product.priceMinor} ${product.currency})`,
  );

  /* ---------------------------------------------------------------------- */
  section("1. Checkout input validation");

  {
    const invalid = makeCheckoutPayload(product);
    invalid.items[0].priceMinor = 1;

    const response = await jsonPost("/api/checkout", invalid);

    assert(
      response.status === 400,
      "Клієнт не може injected priceMinor",
      response,
    );
  }

  {
    const response = await jsonPost(
      "/api/checkout",
      makeCheckoutPayload(product, { items: [] }),
    );

    assert(
      response.status === 400,
      "Порожній кошик відхиляється",
      response,
    );
  }

  {
    const payload = makeCheckoutPayload(product);
    payload.items = [
      {
        productId: "definitely-non-existent-product",
        quantity: 1,
      },
    ];

    const response = await jsonPost("/api/checkout", payload);

    assert(
      response.status === 422,
      "Невідомий SKU відхиляється сервером",
      response,
    );
  }

  {
    const payload = makeCheckoutPayload(product);
    payload.items[0].quantity = 21;

    const response = await jsonPost("/api/checkout", payload);

    assert(
      response.status === 400,
      "Quantity > schema limit відхиляється",
      response,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("2. Checkout + UTF-8 LiqPay payload");

  const primaryOrder = await createTestOrder(product);

  assert(
    typeof primaryOrder.orderId === "string",
    "Checkout повернув orderId",
  );

  assert(
    primaryOrder.mode === "liqpay",
    "Sandbox checkout працює саме у LiqPay mode",
    primaryOrder,
  );

  if (primaryOrder.mode === "liqpay") {
    assert(
      typeof primaryOrder.data === "string" &&
        typeof primaryOrder.signature === "string",
      "Checkout повернув data + signature",
    );

    try {
      const decoded = JSON.parse(decodeUtf8Base64(primaryOrder.data));

      assert(
        decoded.order_id === primaryOrder.orderId,
        "UTF-8 Base64 payload має правильний order_id",
        decoded,
      );

      assert(
        typeof decoded.description === "string" &&
          decoded.description.includes("Оплата замовлення"),
        "Український description пережив UTF-8 → Base64 → UTF-8",
        decoded.description,
      );

      assert(
        decoded.public_key === PUBLIC_KEY,
        "Payload використовує правильний LiqPay public_key",
      );

      assert(
        verifySignature(primaryOrder.data, primaryOrder.signature),
        "Checkout signature криптографічно відповідає data",
      );
    } catch (error) {
      fail("Не вдалося декодувати checkout LiqPay payload", error);
    }
  }

  const primaryBefore = await getStatus(primaryOrder.orderId);

  assert(
    primaryBefore.status === 200 &&
      primaryBefore.body.status === "AWAITING_PAYMENT",
    "Новий order починається у AWAITING_PAYMENT",
    primaryBefore,
  );

  assert(
    primaryBefore.body.totalMinor === product.priceMinor,
    "Сума в D1 відповідає canonical catalog price",
    {
      expected: product.priceMinor,
      actual: primaryBefore.body.totalMinor,
    },
  );

  /* ---------------------------------------------------------------------- */
  section("3. Callback authentication / malformed input");

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
    );

    const data = encodeCallback(payload);

    const response = await callback(data, "INVALID_SIGNATURE");

    assert(
      response.status === 403,
      "Invalid signature → 403",
      response,
    );

    const state = await getStatus(primaryOrder.orderId);

    assert(
      state.body.status === "AWAITING_PAYMENT",
      "Invalid signature не змінює order state",
      state.body,
    );
  }

  {
    const malformedData = "%%%this-is-not-valid-base64%%%";
    const response = await callback(
      malformedData,
      createSignature(malformedData),
    );

    assert(
      response.status === 400,
      "Підписаний, але malformed Base64 payload → 400",
      response,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("4. Public key / action integrity");

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      { public_key: "attacker-public-key" },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 400,
      "Valid signature + wrong public_key → reject",
      response,
    );
  }

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      { action: "refund" },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 400,
      "Valid signature + wrong action → reject",
      response,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("5. Financial reconciliation");

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      {
        amount: primaryBefore.body.totalMinor / 100 + 0.01,
      },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 422,
      "Amount +1 копійка → reject",
      response,
    );
  }

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      {
        amount: Math.max(
          0,
          primaryBefore.body.totalMinor / 100 - 0.01,
        ),
      },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 422,
      "Amount -1 копійка → reject",
      response,
    );
  }

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      {
        currency: "EUR",
      },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 422,
      "Wrong currency → reject",
      response,
    );
  }

  const afterFinancialAttacks = await getStatus(primaryOrder.orderId);

  assert(
    afterFinancialAttacks.body.status === "AWAITING_PAYMENT",
    "Financial mismatch callbacks не змінили order",
    afterFinancialAttacks.body,
  );

  /* ---------------------------------------------------------------------- */
  section("6. Successful payment");

  const successPayload = makeCallbackPayload(
    primaryOrder.orderId,
    primaryBefore.body.totalMinor,
  );

  const successData = encodeCallback(successPayload);

  {
    const response = await callback(successData);

    assert(
      response.status === 200,
      "Valid success callback → 200",
      response,
    );

    const status = await getStatus(primaryOrder.orderId);

    assert(
      status.body.status === "PAID",
      "AWAITING_PAYMENT → PAID",
      status.body,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("7. Replay protection");

  {
    const replayResponses = await Promise.all(
      Array.from({ length: 5 }, () => callback(successData)),
    );

    assert(
      replayResponses.every((response) => response.status === 200),
      "Повторні valid callbacks обробляються без 5xx",
      replayResponses.map((r) => r.status),
    );

    const status = await getStatus(primaryOrder.orderId);

    assert(
      status.body.status === "PAID",
      "Replay success не змінює PAID",
      status.body,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("8. Forbidden PAID → PAYMENT_FAILED regression");

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      {
        status: "failure",
      },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 200,
      "Late failure callback прийнятий без server error",
      response,
    );

    const state = await getStatus(primaryOrder.orderId);

    assert(
      state.body.status === "PAID",
      "Late failure НЕ може зробити PAID → PAYMENT_FAILED",
      state.body,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("9. Refund/reversal state");

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      {
        status: "reversed",
      },
    );

    const response = await callback(encodeCallback(payload));

    assert(
      response.status === 200,
      "reversed callback прийнятий",
      response,
    );

    const state = await getStatus(primaryOrder.orderId);

    assert(
      state.body.status === "REVERSED",
      "PAID → REVERSED",
      state.body,
    );
  }

  {
    const payload = makeCallbackPayload(
      primaryOrder.orderId,
      primaryBefore.body.totalMinor,
      {
        status: "success",
      },
    );

    await callback(encodeCallback(payload));

    const state = await getStatus(primaryOrder.orderId);

    assert(
      state.body.status === "REVERSED",
      "REVERSED не воскресає назад у PAID",
      state.body,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("10. PAYMENT_FAILED recovery");

  const failedOrder = await createTestOrder(product);
  const failedBefore = await getStatus(failedOrder.orderId);

  {
    const failurePayload = makeCallbackPayload(
      failedOrder.orderId,
      failedBefore.body.totalMinor,
      {
        status: "failure",
      },
    );

    await callback(encodeCallback(failurePayload));

    const state = await getStatus(failedOrder.orderId);

    assert(
      state.body.status === "PAYMENT_FAILED",
      "AWAITING_PAYMENT → PAYMENT_FAILED",
      state.body,
    );
  }

  {
    const recoveryPayload = makeCallbackPayload(
      failedOrder.orderId,
      failedBefore.body.totalMinor,
      {
        status: "success",
      },
    );

    await callback(encodeCallback(recoveryPayload));

    const state = await getStatus(failedOrder.orderId);

    assert(
      state.body.status === "PAID",
      "PAYMENT_FAILED → PAID recovery",
      state.body,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("11. Concurrent callback race");

  const raceOrder = await createTestOrder(product);
  const raceBefore = await getStatus(raceOrder.orderId);

  const racePayload = makeCallbackPayload(
    raceOrder.orderId,
    raceBefore.body.totalMinor,
    {
      status: "success",
    },
  );

  const raceData = encodeCallback(racePayload);

  const raceResponses = await Promise.all(
    Array.from({ length: 10 }, () => callback(raceData)),
  );

  assert(
    raceResponses.every((r) => r.status === 200),
    "10 simultaneous callbacks не викликали server errors",
    raceResponses.map((r) => r.status),
  );

  const raceAfter = await getStatus(raceOrder.orderId);

  assert(
    raceAfter.body.status === "PAID",
    "Concurrent race завершується детерміновано у PAID",
    raceAfter.body,
  );

  /* ---------------------------------------------------------------------- */
  section("12. Status endpoint information handling");

  {
    const fakeUuid = crypto.randomUUID();

    const response = await getStatus(fakeUuid);

    assert(
      response.status === 404,
      "Unknown order UUID → 404",
      response,
    );
  }

  /* ---------------------------------------------------------------------- */
  section("13. Checkout idempotency probe");

  {
    const payload = makeCheckoutPayload(product);

    const [a, b] = await Promise.all([
      jsonPost("/api/checkout", payload),
      jsonPost("/api/checkout", payload),
    ]);

    if (
      a.body?.ok &&
      b.body?.ok &&
      a.body?.orderId &&
      b.body?.orderId &&
      a.body.orderId !== b.body.orderId
    ) {
      warn(
        `Однакові concurrent checkout requests створили два orders: ` +
          `${a.body.orderId} та ${b.body.orderId}. ` +
          `Checkout idempotency ще НЕ реалізована.`,
      );
    } else {
      pass("Checkout duplicate protection/idempotency присутня");
    }
  }

  /* ---------------------------------------------------------------------- */
  section("FINAL REPORT");

  console.log(`
Passed:   ${passed}
Failed:   ${failed}
Warnings: ${warnings}
`);

  if (failed === 0) {
    console.log(
      "🎉 CORE PAYMENT AUDIT PASSED: криптографія, reconciliation і state machine пройшли adversarial E2E.",
    );

    if (warnings > 0) {
      console.log(
        "⚠️  Але warnings — це реальні architecture gaps, не косметика.",
      );
    }
  } else {
    console.error(
      "🚨 PAYMENT AUDIT FAILED. Production deployment фінансового контуру блокований.",
    );
  }

  process.exitCode = failed === 0 ? 0 : 1;
}

run().catch((error) => {
  console.error("\n💥 AUDIT HARNESS CRASHED:");
  console.error(error);
  process.exitCode = 1;
});
