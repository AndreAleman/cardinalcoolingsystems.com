import { decidePayment, totalOrderWeightLbs } from "../payment-rules";

/* The money rules (docs/specs/company-dashboard.md, decided 2026-08-31):
   - Company with invoice payment enabled: every order any size is invoiced.
   - 120 lbs or less: pay in full at checkout.
   - Over 120 lbs (UPS limit), under $7,500: freight must be quoted.
   - Over 120 lbs, $7,500 or more: freight free -> 50% deposit, balance
     invoiced 30 days after arrival.
   - Unknown weight or an unpriced ($0) line: quote only. */

describe("decidePayment", () => {
  it("invoices every order for an invoice-enabled Company, any size or weight", () => {
    expect(
      decidePayment({ totalUsd: 250_000, totalWeightLbs: 900, hasQuoteOnlyLine: false, invoiceEnabled: true })
    ).toBe("invoice");
    expect(
      decidePayment({ totalUsd: 40, totalWeightLbs: 2, hasQuoteOnlyLine: false, invoiceEnabled: true })
    ).toBe("invoice");
  });

  it("takes full payment for orders at or under 120 lbs", () => {
    expect(
      decidePayment({ totalUsd: 9_999, totalWeightLbs: 120, hasQuoteOnlyLine: false, invoiceEnabled: false })
    ).toBe("pay_in_full");
    expect(
      decidePayment({ totalUsd: 30_000, totalWeightLbs: 80, hasQuoteOnlyLine: false, invoiceEnabled: false })
    ).toBe("pay_in_full");
  });

  it("requires a quote over 120 lbs when the total is under $7,500", () => {
    expect(
      decidePayment({ totalUsd: 7_499.99, totalWeightLbs: 121, hasQuoteOnlyLine: false, invoiceEnabled: false })
    ).toBe("quote_required");
  });

  it("takes a 50% deposit over 120 lbs at $7,500 or more", () => {
    expect(
      decidePayment({ totalUsd: 7_500, totalWeightLbs: 121, hasQuoteOnlyLine: false, invoiceEnabled: false })
    ).toBe("deposit_50");
    expect(
      decidePayment({ totalUsd: 22_000, totalWeightLbs: 400, hasQuoteOnlyLine: false, invoiceEnabled: false })
    ).toBe("deposit_50");
  });

  it("requires a quote when any line's weight is unknown", () => {
    expect(
      decidePayment({ totalUsd: 500, totalWeightLbs: null, hasQuoteOnlyLine: false, invoiceEnabled: false })
    ).toBe("quote_required");
  });

  it("requires a quote when any line is quote-only (unpriced or flagged)", () => {
    expect(
      decidePayment({ totalUsd: 500, totalWeightLbs: 10, hasQuoteOnlyLine: true, invoiceEnabled: false })
    ).toBe("quote_required");
  });
});

describe("totalOrderWeightLbs", () => {
  it("sums weight times quantity across lines", () => {
    expect(
      totalOrderWeightLbs([
        { weightLbs: 20, quantity: 3 },
        { weightLbs: 5, quantity: 2 },
      ])
    ).toBe(70);
  });

  it("returns null when any line is missing a weight", () => {
    expect(
      totalOrderWeightLbs([
        { weightLbs: 20, quantity: 1 },
        { weightLbs: null, quantity: 1 },
      ])
    ).toBeNull();
    expect(totalOrderWeightLbs([{ weightLbs: 0, quantity: 1 }])).toBeNull();
  });

  it("returns 0 for an empty order", () => {
    expect(totalOrderWeightLbs([])).toBe(0);
  });
});
