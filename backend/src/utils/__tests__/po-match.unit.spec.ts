import { extractSkuTokens, matchLineToSku } from "../po-match";

/*
  PO Read-Out matching (spec slice 3): buyers' POs bury the part number
  inside the description — e.g. Empirical's real PO line reads
  "RDCR CONC 2.00X1.50 BW TUBE S&O'B 31W-2X15-7-304 2.00 LG 304 SS
  .065 WALL" where only "31W-2X15-7-304" is a Cardinal SKU. Matching is
  exact-by-token against the catalog, case-insensitive; substring
  matching is deliberately avoided (it surfaces unrelated parts).
*/

describe("extractSkuTokens", () => {
  it("pulls SKU-shaped tokens out of a description line", () => {
    const tokens = extractSkuTokens(
      "RDCR CONC 2.00X1.50 BW TUBE S&O'B 31W-2X15-7-304 2.00 LG 304 SS .065 WALL"
    );
    expect(tokens).toContain("31W-2X15-7-304");
  });

  it("uppercases and dedupes", () => {
    const tokens = extractSkuTokens("part cm-100 and again CM-100");
    expect(tokens.filter((token) => token === "CM-100")).toHaveLength(1);
  });
});

describe("matchLineToSku", () => {
  const catalog = new Set(["31W-2X15-7-304", "L2KS-2-7-304", "CM-100"]);

  it("matches a line whose description embeds a catalog SKU", () => {
    expect(
      matchLineToSku(
        "ELBOW 45 2.00 BW TUBE S&O'B L2KS-2-7-304 2.312 F-CNTR 3.00R 304 SS",
        catalog
      )
    ).toEqual("L2KS-2-7-304");
  });

  it("matches case-insensitively", () => {
    expect(matchLineToSku("qty of cm-100 please", catalog)).toEqual("CM-100");
  });

  it("returns null when nothing matches exactly", () => {
    expect(matchLineToSku("MYSTERY PART 9999-XYZ", catalog)).toBeNull();
  });

  it("returns null when a token is only a partial SKU", () => {
    expect(matchLineToSku("TUBE 304 SS .065 WALL", catalog)).toBeNull();
  });
});
