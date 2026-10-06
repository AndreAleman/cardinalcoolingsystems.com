import { isTubeItem, isWholeSticks, roundUpToSticks } from "../tube-sticks";

describe("tube sticks (20 ft)", () => {
  it("detects tube by unit, handle, or AI270/A270 SKU", () => {
    expect(isTubeItem({ metadata: { unit: "ft" } })).toBe(true);
    expect(isTubeItem({ productMetadata: { unit: "ft" } })).toBe(true);
    expect(isTubeItem({ productHandle: "id-od-pol-tube-a270-3a-import" })).toBe(true);
    expect(isTubeItem({ sku: "AI270P-4400" })).toBe(true);
    expect(isTubeItem({ sku: "A270P-6075" })).toBe(true);
    expect(isTubeItem({ sku: "13H-100", metadata: { unit: "ea" } })).toBe(false);
    expect(isTubeItem(null)).toBe(false);
  });

  it("accepts only whole sticks", () => {
    expect([20, 40, 200].every(isWholeSticks)).toBe(true);
    expect([0, 1, 19, 21, 25.5, -20].some(isWholeSticks)).toBe(false);
  });

  it("rounds up to whole sticks, minimum one", () => {
    expect(roundUpToSticks(1)).toBe(20);
    expect(roundUpToSticks(0)).toBe(20);
    expect(roundUpToSticks(20)).toBe(20);
    expect(roundUpToSticks(21)).toBe(40);
    expect(roundUpToSticks(59)).toBe(60);
  });
});
