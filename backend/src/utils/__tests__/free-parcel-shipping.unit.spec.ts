import { decideFreeParcelShipping } from "../free-parcel-shipping";

/* Free parcel shipping (ADR-0009): items subtotal $100+ and the whole
   shipment 120 lbs or less (UPS parcel limit, ADR-0006). Amounts are
   dollars, not cents. */

describe("decideFreeParcelShipping", () => {
  it("rates a $99.99 parcel normally", () => {
    const d = decideFreeParcelShipping([{ unitPrice: 99.99, quantity: 1, weightLbs: 2 }]);
    expect(d).toMatchObject({ free: false, reason: "below_threshold", subtotalUsd: 99.99 });
  });

  it("ships a $100 parcel free", () => {
    const d = decideFreeParcelShipping([
      { unitPrice: 25, quantity: 2, weightLbs: 1 },
      { unitPrice: 50, quantity: 1, weightLbs: 3 },
    ]);
    expect(d).toMatchObject({ free: true, reason: "free", subtotalUsd: 100, weightLbs: 5 });
  });

  it("ships exactly 120 lbs free (the parcel limit is inclusive)", () => {
    const d = decideFreeParcelShipping([{ unitPrice: 10, quantity: 12, weightLbs: 10 }]);
    expect(d).toMatchObject({ free: true, weightLbs: 120 });
  });

  it("does not ship $150 at 130 lbs free (freight)", () => {
    const d = decideFreeParcelShipping([{ unitPrice: 15, quantity: 10, weightLbs: 13 }]);
    expect(d).toMatchObject({ free: false, reason: "over_parcel_weight", subtotalUsd: 150, weightLbs: 130 });
  });

  it("does not ship free when any line has no weight", () => {
    for (const weightLbs of [null, undefined, 0]) {
      const d = decideFreeParcelShipping([
        { unitPrice: 80, quantity: 1, weightLbs: 2 },
        { unitPrice: 40, quantity: 1, weightLbs },
      ]);
      expect(d).toMatchObject({ free: false, reason: "missing_weight", weightLbs: null });
    }
  });

  it("uses dollars, not cents: a $36.83 cart is below the threshold", () => {
    const d = decideFreeParcelShipping([{ unitPrice: 36.83, quantity: 1, weightLbs: 1 }]);
    expect(d.free).toBe(false);
  });

  it("is not thrown off by float noise", () => {
    const d = decideFreeParcelShipping([{ unitPrice: 33.34, quantity: 3, weightLbs: 1 }]);
    expect(d).toMatchObject({ free: true, subtotalUsd: 100.02 });
  });
});
