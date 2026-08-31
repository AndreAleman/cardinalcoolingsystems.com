/**
 * Quote ownership rule.
 *
 * dashboardGate only proves the CALLER is an approved Company's Team
 * Member — it never relates the quote to the caller. This check does: a
 * store-side quote action is allowed only for the exact customer the
 * quote was created for. Missing ids fail closed.
 */
export function isQuoteOwner(
  quote: { customer_id?: string | null },
  customerId: string | null | undefined
): boolean {
  return Boolean(
    quote.customer_id && customerId && quote.customer_id === customerId
  );
}
