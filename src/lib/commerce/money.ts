const SITE_LOCALE = "en";
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const existingFormatter = currencyFormatters.get(currency);

  if (existingFormatter !== undefined) {
    return existingFormatter;
  }

  const formatter = new Intl.NumberFormat(SITE_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  });

  currencyFormatters.set(currency, formatter);
  return formatter;
}

/**
 * Formats an integer amount expressed in a currency's smallest unit.
 * Cart and catalog values remain integers until this presentation boundary.
 */
export function formatMoneyMinor(
  amountMinor: number,
  currency: string,
): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError("Money must be a non-negative safe integer.");
  }

  if (!CURRENCY_CODE_PATTERN.test(currency)) {
    throw new RangeError("Currency must be a three-letter uppercase code.");
  }

  const formatter = getCurrencyFormatter(currency);
  const fractionDigits =
    formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const minorUnitScale = 10 ** fractionDigits;

  return formatter.format(amountMinor / minorUnitScale);
}
