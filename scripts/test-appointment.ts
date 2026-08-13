import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createLeadDispatcher,
  type AppointmentDispatcher,
} from "../src/lib/leads/dispatcher.ts";
import { handleAppointmentRequest } from "../src/pages/api/appointments.ts";
import {
  APPOINTMENT_MIN_SUBMIT_MS,
  appointmentSchema,
  getAppointmentFieldErrors,
  type AppointmentFieldErrorCode,
  type AppointmentFieldErrors,
} from "../src/schemas/appointment.ts";

const validRequest = {
  name: "Іван Петренко",
  phone: "+380501234567",
  website: "",
  elapsedMs: APPOINTMENT_MIN_SUBMIT_MS,
};

const successfulTestDispatcher: AppointmentDispatcher = async () => {};

function parseAppointment(
  overrides: Partial<typeof validRequest> = {},
): { name: string; phone: string } {
  return appointmentSchema.parse({ ...validRequest, ...overrides });
}

function fieldErrorsFor(
  overrides: Partial<typeof validRequest>,
): AppointmentFieldErrors {
  const result = appointmentSchema.safeParse({
    ...validRequest,
    ...overrides,
  });

  assert.equal(result.success, false, "Expected appointment input to fail");
  return getAppointmentFieldErrors(result.error);
}

function assertFieldError(
  field: keyof AppointmentFieldErrors,
  code: AppointmentFieldErrorCode,
  overrides: Partial<typeof validRequest>,
): void {
  assert.equal(fieldErrorsFor(overrides)[field], code);
}

const validNameCases = [
  ["  Мар’яна   Ковальчук ", "Мар’яна Ковальчук"],
  ["О'Коннор", "О'Коннор"],
  ["Оʼлена", "Оʼлена"],
  ["Анна-Марія", "Анна-Марія"],
  ["Лі", "Лі"],
  ["Li", "Li"],
  ["Jose\u0301", "José"],
  ["李雷", "李雷"],
] as const;

for (const [input, expected] of validNameCases) {
  assert.equal(parseAppointment({ name: input }).name, expected);
}

assertFieldError("name", "NAME_REQUIRED", { name: "   " });
assertFieldError("name", "NAME_LENGTH", { name: "A" });
assertFieldError("name", "NAME_LENGTH", { name: "А".repeat(81) });
assertFieldError("name", "NAME_FORMAT", { name: "Іван 2" });
assertFieldError("name", "NAME_FORMAT", {
  name: "https://spam.example",
});
assertFieldError("name", "NAME_FORMAT", { name: "spam@example.com" });
assertFieldError("name", "NAME_FORMAT", { name: "Іван $$$$" });
assertFieldError("name", "NAME_FORMAT", { name: "І\u0007ван" });
assertFieldError("name", "NAME_FORMAT", { name: "--Анна--" });

const validPhoneCases = [
  ["0501234567", "+380501234567"],
  ["050 123 45 67", "+380501234567"],
  ["(050) 123-45-67", "+380501234567"],
  ["380501234567", "+380501234567"],
  ["+38 (050) 123-45-67", "+380501234567"],
  ["+421 905 123 456", "+421905123456"],
  ["0044 7700 900123", "+447700900123"],
  ["+12345678", "+12345678"],
] as const;

for (const [input, expected] of validPhoneCases) {
  assert.equal(parseAppointment({ phone: input }).phone, expected);
}

assertFieldError("phone", "PHONE_REQUIRED", { phone: "" });
assertFieldError("phone", "PHONE_LENGTH", { phone: "+1234567" });
assertFieldError("phone", "PHONE_LENGTH", {
  phone: "+1234567890123456",
});
assertFieldError("phone", "PHONE_LENGTH", { phone: "+38050123456" });
assertFieldError("phone", "PHONE_LENGTH", { phone: "+3805012345678" });
assertFieldError("phone", "PHONE_FORMAT", { phone: "+380ABC123456" });
assertFieldError("phone", "PHONE_FORMAT", {
  phone: "+380501234567 ext 8",
});
assertFieldError("phone", "PHONE_FORMAT", { phone: "447700900123" });
assertFieldError("phone", "PHONE_FORMAT", { phone: "++380501234567" });
assertFieldError("phone", "PHONE_REPEATED", { phone: "+11111111" });
assertFieldError("phone", "PHONE_REPEATED", {
  phone: "+380501111111",
});

assert.deepEqual(parseAppointment(), {
  name: "Іван Петренко",
  phone: "+380501234567",
});
assert.equal(
  appointmentSchema.safeParse({ ...validRequest, website: "bot.example" })
    .success,
  false,
);
assert.equal(
  appointmentSchema.safeParse({
    ...validRequest,
    elapsedMs: APPOINTMENT_MIN_SUBMIT_MS - 1,
  }).success,
  false,
);
assert.equal(
  appointmentSchema.safeParse({ ...validRequest, unexpected: "field" })
    .success,
  false,
);

function createAppointmentRequest(
  body: string,
  contentType = "application/json; charset=utf-8",
): Request {
  return new Request("https://clinic.example/api/appointments", {
    method: "POST",
    headers: {
      "content-type": contentType,
      origin: "https://clinic.example",
    },
    body,
  });
}

async function postAppointment(
  body: string,
  contentType = "application/json; charset=utf-8",
  dispatcher: AppointmentDispatcher = successfulTestDispatcher,
): Promise<Response> {
  return handleAppointmentRequest(
    createAppointmentRequest(body, contentType),
    dispatcher,
  );
}

const invalidApiResponse = await postAppointment(
  JSON.stringify({ ...validRequest, name: "Іван 2", phone: "+1234567" }),
);
assert.equal(invalidApiResponse.status, 400);
assert.deepEqual(await invalidApiResponse.json(), {
  ok: false,
  error: "INVALID_INPUT",
  fieldErrors: {
    name: "NAME_FORMAT",
    phone: "PHONE_LENGTH",
  },
});

const spamApiResponse = await postAppointment(
  JSON.stringify({ ...validRequest, website: "bot.example" }),
);
assert.equal(spamApiResponse.status, 400);
assert.deepEqual(await spamApiResponse.json(), {
  ok: false,
  error: "INVALID_INPUT",
  fieldErrors: {},
});

const validApiResponse = await postAppointment(JSON.stringify(validRequest));
assert.equal(validApiResponse.status, 200);
assert.deepEqual(await validApiResponse.json(), { ok: true });

const unconfiguredApiResponse = await handleAppointmentRequest(
  createAppointmentRequest(JSON.stringify(validRequest)),
);
assert.equal(unconfiguredApiResponse.status, 502);
assert.deepEqual(await unconfiguredApiResponse.json(), {
  ok: false,
  error: "UPSTREAM_ERROR",
});

let deliveredPayload: unknown;
const configuredDispatcher = createLeadDispatcher(
  {
    LEAD_API_URL: "https://leads.example.test/appointments",
    LEAD_API_TOKEN: "synthetic-test-token",
  },
  async (input, init) => {
    assert.equal(String(input), "https://leads.example.test/appointments");
    assert.equal(init?.method, "POST");
    assert.equal(init?.redirect, "error");
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      "Bearer synthetic-test-token",
    );
    if (typeof init?.body !== "string") {
      throw new Error("Expected a JSON string request body");
    }
    deliveredPayload = JSON.parse(init.body);
    return new Response(null, { status: 204 });
  },
);
const configuredApiResponse = await postAppointment(
  JSON.stringify(validRequest),
  "application/json; charset=utf-8",
  configuredDispatcher,
);
assert.equal(configuredApiResponse.status, 200);
assert.deepEqual(await configuredApiResponse.json(), { ok: true });
assert.deepEqual(deliveredPayload, {
  name: "Іван Петренко",
  phone: "+380501234567",
});

let unconfiguredFetchCalled = false;
const unconfiguredDispatcher = createLeadDispatcher({}, async () => {
  unconfiguredFetchCalled = true;
  return new Response(null, { status: 204 });
});
const unconfiguredDispatcherResponse = await postAppointment(
  JSON.stringify(validRequest),
  "application/json; charset=utf-8",
  unconfiguredDispatcher,
);
assert.equal(unconfiguredDispatcherResponse.status, 502);
assert.equal(unconfiguredFetchCalled, false);

const failingDispatcher = createLeadDispatcher(
  {
    LEAD_API_URL: "https://leads.example.test/appointments",
    LEAD_API_TOKEN: "synthetic-test-token",
  },
  async () => new Response(null, { status: 500 }),
);
const failedDispatchResponse = await postAppointment(
  JSON.stringify(validRequest),
  "application/json; charset=utf-8",
  failingDispatcher,
);
assert.equal(failedDispatchResponse.status, 502);
assert.deepEqual(await failedDispatchResponse.json(), {
  ok: false,
  error: "UPSTREAM_ERROR",
});

const wrongTypeApiResponse = await postAppointment(
  JSON.stringify(validRequest),
  "text/plain",
);
assert.equal(wrongTypeApiResponse.status, 400);

const formSource = readFileSync(
  new URL("../src/components/clinic/AppointmentForm.astro", import.meta.url),
  "utf8",
);
const apiSource = readFileSync(
  new URL("../src/pages/api/appointments.ts", import.meta.url),
  "utf8",
);
const schemaSource = readFileSync(
  new URL("../src/schemas/appointment.ts", import.meta.url),
  "utf8",
);
const dispatcherSource = readFileSync(
  new URL("../src/lib/leads/dispatcher.ts", import.meta.url),
  "utf8",
);

for (const expectedMarkup of [
  'aria-describedby="appointment-name-error"',
  'aria-describedby="appointment-phone-error"',
  'aria-invalid="false"',
  'data-field-error="name"',
  'data-field-error="phone"',
  'name="website"',
  'tabindex="-1"',
  "scroll-mt-24",
  "sm:scroll-mt-28",
  "elapsedMs",
  "fieldInputs[firstClientInvalidField].focus()",
  "trackAppointmentSuccess()",
]) {
  assert.ok(
    formSource.includes(expectedMarkup),
    `Appointment form is missing ${expectedMarkup}`,
  );
}

for (const source of [formSource, apiSource, schemaSource, dispatcherSource]) {
  assert.equal(
    /console\.(?:log|info|warn|error|debug)/u.test(source),
    false,
    "Appointment flow must not write patient input to console logs",
  );
}

console.log("Appointment validation/API/UI checks passed.");
