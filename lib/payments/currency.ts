/**
 * Stripe expresses amounts in the currency's smallest unit. For most
 * currencies that's 1/100 of the major unit (USD cents), but zero-decimal
 * currencies (JPY, KRW, …) have no minor unit — their `amount_total` is already
 * the major-unit value, so dividing by 100 would be wrong by 100× (N8).
 *
 * https://docs.stripe.com/currencies#zero-decimal
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf",
  "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

/** Convert a Stripe minor-unit amount to major units, currency-aware. */
export function fromStripeMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())
    ? amount
    : amount / 100;
}
