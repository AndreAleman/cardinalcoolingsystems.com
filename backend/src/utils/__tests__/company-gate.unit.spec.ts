import { gateCompany } from "../company-gate";

const ctx = { teamMemberId: "emp_1", companyId: "comp_A", role: "admin" as const };

describe("gateCompany", () => {
  it("lets an Approved Company's Team Member through", () => {
    expect(gateCompany(ctx, "approved")).toEqual({ ok: true, context: ctx, status: "approved" });
  });

  it("blocks a Pending Company with company_pending", () => {
    expect(gateCompany(ctx, "pending")).toEqual({ ok: false, code: "company_pending", http: 403 });
  });

  it("blocks a Declined Company", () => {
    expect(gateCompany(ctx, "declined")).toEqual({ ok: false, code: "company_declined", http: 403 });
  });

  it("404s a customer with no Company", () => {
    expect(gateCompany(null, null)).toEqual({ ok: false, code: "no_company", http: 404 });
  });
});
