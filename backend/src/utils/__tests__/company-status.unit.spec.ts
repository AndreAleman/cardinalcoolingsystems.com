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

  it("an Approved Company can be declined (ban hammer), not re-approved", () => {
    // Instant access (2026-09-05): signups are born approved, so decline
    // must work on an Approved Company or junk signups can't be banned.
    expect(canDecideCompany("approved", "declined")).toBe(true);
    expect(canDecideCompany("approved", "approved")).toBe(false);
  });
});
