// =============================================================================
// ConMart — Currency Rounding
// =============================================================================
// One rounding rule for the whole application. Every birr amount that is
// stored, displayed, or compared passes through here.
//
// This module has no imports so both client and server code can use it, which
// is what keeps a client-side price preview from disagreeing with the server's
// authoritative calculation.
// =============================================================================

const CENTS = 100;

/**
 * Multiplies by 100 via the number's decimal representation.
 *
 * `magnitude * 100` is evaluated in binary and inherits the error already in
 * the operand: 1.005 is stored as 1.00499999999999989, so the product is
 * 100.49999999999999 and rounds down to a full cent less than intended.
 * Re-parsing `"1.005e2"` yields exactly 100.5 instead, because the shift
 * happens in the decimal text rather than in binary.
 */
function scaleToCents(magnitude: number): number {
  const text = magnitude.toString();

  // Magnitudes beyond ~1e21 or below ~1e-7 stringify in exponential form,
  // which cannot take a second exponent. No real birr amount lands there, and
  // a binary multiply is accurate enough at those scales.
  if (text.includes("e")) {
    return magnitude * CENTS;
  }

  return Number(`${text}e2`);
}

/**
 * Rounds to whole cents, with exact half cents going away from zero.
 *
 * Sign is handled separately because `Math.round` breaks ties toward positive
 * infinity: it would send 1.005 to 1.01 but -1.005 to -1.00, so a refund and
 * the charge it reverses could differ by a cent.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot round a non-finite amount: ${value}`);
  }

  const cents = Math.round(scaleToCents(Math.abs(value)));

  // Returning early keeps a small negative input from producing -0, which is
  // not `Object.is`-equal to 0 and would surface as "-0.00 ETB".
  if (cents === 0) {
    return 0;
  }

  return (value < 0 ? -cents : cents) / CENTS;
}

// =============================================================================
// FORMATTING
// =============================================================================
// Using Intl.NumberFormat rather than .toFixed() so the decimal separator,
// digit grouping, and currency symbol are locale-correct for both English and
// Amharic readers. Node.js 18+ ships full ICU data so am-ET works server-side.
// =============================================================================

export const SUPPORTED_LOCALES = ["en-ET", "am-ET"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const formattersCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, style: "currency" | "decimal"): Intl.NumberFormat {
  const key = `${locale}:${style}`;
  if (!formattersCache.has(key)) {
    formattersCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style,
        currency: style === "currency" ? "ETB" : undefined,
        minimumFractionDigits: style === "currency" ? 2 : 0,
        maximumFractionDigits: style === "currency" ? 2 : 0,
      })
    );
  }
  return formattersCache.get(key)!;
}

/**
 * Formats an amount in Ethiopian Birr with the currency symbol.
 *
 * @example formatCurrency(1280) → "ETB 1,280.00"
 * @example formatCurrency(1280, "am-ET") → "ብር 1,280.00" (Amharic)
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale | (string & {}) = "en-ET"
): string {
  const rounded = roundCurrency(amount);
  return getFormatter(locale, "currency").format(rounded);
}

/**
 * Short-form number with comma grouping (no currency symbol).
 * Useful in compact table cells where the ETB column header implies the unit.
 *
 * @example formatAmount(1280.5) → "1,281"
 */
export function formatAmount(
  amount: number,
  locale: SupportedLocale | (string & {}) = "en-ET"
): string {
  const rounded = roundCurrency(amount);
  return getFormatter(locale, "decimal").format(rounded);
}

