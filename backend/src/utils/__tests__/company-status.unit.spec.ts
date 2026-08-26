import { canDecideCompany } from "../../modules/company/types/status";

describe("canDecideCompany", () => {
  it("a Pending Company can be approved or declined", () => {
    expect(canDecideCompany("pending", "approved")).toBe(true);
    expect(canDecideCompany("pending", "declined")).toBe(true);
  });

  it("a Declined Company can be reinstated, not re-declined", () => {
    expect(canDecideCompany("declined", "approved")).toBe(true);
    expect(canDecideCompany("declined", "declined")).toBe(false);
  });

  it("an Approved Company is never flipped", () => {
    expect(canDecideCompany("approved", "declined")).toBe(false);
    expect(canDecideCompany("approved", "approved")).toBe(false);
  });
});
