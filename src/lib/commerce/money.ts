import {
  defaultLocale,
  type Locale,
} from "../i18n/config";

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(
  currency: string,
  locale: Locale,
): Intl.NumberFormat {
  const formatterKey = `${locale}:${currency}`;
  const existingFormatter = currencyFormatters.get(formatterKey);

  if (existingFormatter !== undefined) {
    return existingFormatter;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  });

  currencyFormatters.set(formatterKey, formatter);
  return formatter;
}

/**
 * Formats an integer amount expressed in a currency's smallest unit.
 * Cart and catalog values remain integers until this presentation boundary.
 */
export function formatMoneyMinor(
  amountMinor: number,
  currency: string,
  locale: Locale = defaultLocale,
): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError("Money must be a non-negative safe integer.");
  }

  if (!CURRENCY_CODE_PATTERN.test(currency)) {
    throw new RangeError("Currency must be a three-letter uppercase code.");
  }

  const formatter = getCurrencyFormatter(currency, locale);
  const fractionDigits =
    formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const minorUnitScale = 10 ** fractionDigits;

  return formatter.format(amountMinor / minorUnitScale);
}
