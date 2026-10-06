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

/* Tube always ships freight (owner, Oct 2026): any tube line makes the
   order not eligible, however light or expensive it is. */
describe("decideFreeParcelShipping with tube", () => {
  const fitting = { unitPrice: 120, quantity: 1, weightLbs: 2 };

  it("still ships an eligible non-tube parcel free", () => {
    const d = decideFreeParcelShipping([{ ...fitting, sku: "13H-100", productHandle: "tri-clamp-ferrule", unit: null }]);
    expect(d).toMatchObject({ free: true, reason: "free" });
  });

  it("is not free when a line's variant unit is ft", () => {
    const d = decideFreeParcelShipping([fitting, { unitPrice: 5.51, quantity: 20, weightLbs: 0.67, unit: "ft" }]);
    expect(d).toMatchObject({ free: false, reason: "tube_ships_freight" });
  });

  it("is not free when a line is the A270 tube product", () => {
    const d = decideFreeParcelShipping([
      fitting,
      { unitPrice: 5.51, quantity: 20, weightLbs: 0.67, productHandle: "id-od-pol-tube-a270-3a-import" },
    ]);
    expect(d).toMatchObject({ free: false, reason: "tube_ships_freight" });
  });

  it("is not free for AI270 or A270 SKUs", () => {
    for (const sku of ["AI270P-4200", "A270P-4100", "a270p-6050", " AI270P-61200"]) {
      const d = decideFreeParcelShipping([fitting, { unitPrice: 6, quantity: 20, weightLbs: 0.5, sku }]);
      expect(d).toMatchObject({ free: false, reason: "tube_ships_freight" });
    }
  });

  it("does not mistake other SKUs for tube", () => {
    for (const sku of ["2700-100", "BA270-1", "13H-270"]) {
      const d = decideFreeParcelShipping([{ ...fitting, sku }]);
      expect(d.free).toBe(true);
    }
  });
});
