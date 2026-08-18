import { z, type ZodError } from "zod";

export const APPOINTMENT_MIN_SUBMIT_MS = 500;

export const APPOINTMENT_FIELD_ERROR_CODES = {
  nameRequired: "NAME_REQUIRED",
  nameLength: "NAME_LENGTH",
  nameFormat: "NAME_FORMAT",
  phoneRequired: "PHONE_REQUIRED",
  phoneLength: "PHONE_LENGTH",
  phoneFormat: "PHONE_FORMAT",
  phoneRepeated: "PHONE_REPEATED",
} as const;

export type AppointmentFieldErrorCode =
  (typeof APPOINTMENT_FIELD_ERROR_CODES)[keyof typeof APPOINTMENT_FIELD_ERROR_CODES];

export interface AppointmentFieldErrors {
  readonly name?: AppointmentFieldErrorCode;
  readonly phone?: AppointmentFieldErrorCode;
}

const FORM_INVALID_CODE = "FORM_INVALID";
const CONTROL_OR_FORMAT_CHARACTER_PATTERN = /[\p{Cc}\p{Cf}]/u;
const URL_OR_EMAIL_PATTERN = /(?:https?:\/\/|www\.|\S+@\S+)/iu;
const ALLOWED_NAME_PATTERN =
  /^(?:\p{L}\p{M}*)+(?:[ '\-’ʼ](?:\p{L}\p{M}*)+)*$/u;
const PHONE_INPUT_PATTERN = /^[+\d\s()-]+$/u;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const REPEATED_PHONE_PATTERN = /^(\d)\1+$/;
const REPEATED_PHONE_SUFFIX_PATTERN = /(\d)\1{6,}$/;
const MAX_RAW_PHONE_CHARACTERS = 40;

const fieldErrorCodeSet = new Set<string>(
  Object.values(APPOINTMENT_FIELD_ERROR_CODES),
);

function isAppointmentFieldErrorCode(
  value: string,
): value is AppointmentFieldErrorCode {
  return fieldErrorCodeSet.has(value);
}

export function normalizeAppointmentName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

type PhoneNormalizationResult =
  | { readonly success: true; readonly value: string }
  | { readonly success: false; readonly code: AppointmentFieldErrorCode };

export function normalizeAppointmentPhone(
  value: string,
): PhoneNormalizationResult {
  const normalizedInput = value.normalize("NFKC").trim();

  if (normalizedInput.length === 0) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneRequired,
    };
  }

  if (
    [...normalizedInput].length > MAX_RAW_PHONE_CHARACTERS ||
    CONTROL_OR_FORMAT_CHARACTER_PATTERN.test(normalizedInput)
  ) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneFormat,
    };
  }

  if (!PHONE_INPUT_PATTERN.test(normalizedInput)) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneFormat,
    };
  }

  const compact = normalizedInput.replace(/[\s()-]/gu, "");
  let canonical: string;

  if (/^0\d{9}$/.test(compact)) {
    canonical = `+38${compact}`;
  } else if (/^380\d{9}$/.test(compact)) {
    canonical = `+${compact}`;
  } else if (/^00\d+$/.test(compact)) {
    canonical = `+${compact.slice(2)}`;
  } else if (/^\+\d+$/.test(compact)) {
    canonical = compact;
  } else {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneFormat,
    };
  }

  const digits = canonical.slice(1);

  if (digits.length < 8 || digits.length > 15) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneLength,
    };
  }

  if (canonical.startsWith("+380") && !/^\+380\d{9}$/.test(canonical)) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneLength,
    };
  }

  if (!E164_PATTERN.test(canonical)) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneFormat,
    };
  }

  if (
    REPEATED_PHONE_PATTERN.test(digits) ||
    REPEATED_PHONE_SUFFIX_PATTERN.test(digits)
  ) {
    return {
      success: false,
      code: APPOINTMENT_FIELD_ERROR_CODES.phoneRepeated,
    };
  }

  return { success: true, value: canonical };
}

const appointmentNameSchema = z
  .string({ error: APPOINTMENT_FIELD_ERROR_CODES.nameRequired })
  .superRefine((value, context) => {
    if (
      CONTROL_OR_FORMAT_CHARACTER_PATTERN.test(value) ||
      URL_OR_EMAIL_PATTERN.test(value)
    ) {
      context.addIssue({
        code: "custom",
        message: APPOINTMENT_FIELD_ERROR_CODES.nameFormat,
      });
    }
  })
  .transform(normalizeAppointmentName)
  .superRefine((value, context) => {
    if (value.length === 0) {
      context.addIssue({
        code: "custom",
        message: APPOINTMENT_FIELD_ERROR_CODES.nameRequired,
      });
      return;
    }

    const characterCount = [...value].length;
    if (characterCount < 2 || characterCount > 80) {
      context.addIssue({
        code: "custom",
        message: APPOINTMENT_FIELD_ERROR_CODES.nameLength,
      });
    }

    const letterCount = value.match(/\p{L}/gu)?.length ?? 0;
    if (letterCount < 2 || !ALLOWED_NAME_PATTERN.test(value)) {
      context.addIssue({
        code: "custom",
        message: APPOINTMENT_FIELD_ERROR_CODES.nameFormat,
      });
    }
  });

const appointmentPhoneSchema = z
  .string({ error: APPOINTMENT_FIELD_ERROR_CODES.phoneRequired })
  .transform((value, context) => {
    const result = normalizeAppointmentPhone(value);

    if (!result.success) {
      context.addIssue({ code: "custom", message: result.code });
      return "";
    }

    return result.value;
  });

export const appointmentSchema = z
  .object({
    name: appointmentNameSchema,
    phone: appointmentPhoneSchema,
    website: z.string({ error: FORM_INVALID_CODE }).max(200, {
      error: FORM_INVALID_CODE,
    }),
    elapsedMs: z
      .number({ error: FORM_INVALID_CODE })
      .int({ error: FORM_INVALID_CODE })
      .min(APPOINTMENT_MIN_SUBMIT_MS, { error: FORM_INVALID_CODE })
      .max(Number.MAX_SAFE_INTEGER, { error: FORM_INVALID_CODE }),
  })
  .strict()
  .superRefine(({ website }, context) => {
    if (website.trim().length > 0) {
      context.addIssue({
        code: "custom",
        message: FORM_INVALID_CODE,
        path: ["website"],
      });
    }
  })
  .transform(({ name, phone, elapsedMs }) => ({ name, phone, elapsedMs }));

export function getAppointmentFieldErrors(
  error: ZodError,
): AppointmentFieldErrors {
  const fieldErrors: {
    name?: AppointmentFieldErrorCode;
    phone?: AppointmentFieldErrorCode;
  } = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "name" || field === "phone") &&
      fieldErrors[field] === undefined &&
      isAppointmentFieldErrorCode(issue.message)
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export type AppointmentRequestInput = z.input<typeof appointmentSchema>;
export type AppointmentInput = z.output<typeof appointmentSchema>;
