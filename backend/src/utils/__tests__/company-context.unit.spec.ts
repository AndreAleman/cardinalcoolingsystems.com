import { companyContextFromCustomer } from "../company-context";

describe("companyContextFromCustomer", () => {
  it("is null for a customer who is not a Team Member", () => {
    expect(companyContextFromCustomer({ id: "cus_1" })).toBeNull();
    expect(companyContextFromCustomer({ id: "cus_1", employee: null })).toBeNull();
    expect(companyContextFromCustomer(null)).toBeNull();
  });

  it("is null when the Team Member has no Company", () => {
    expect(
      companyContextFromCustomer({
        id: "cus_1",
        employee: { id: "emp_1", is_admin: true, company: null },
      })
    ).toBeNull();
  });

  it("returns the Company; a legacy is_admin Team Member is an admin", () => {
    expect(
      companyContextFromCustomer({
        id: "cus_1",
        employee: { id: "emp_1", is_admin: true, company: { id: "comp_A" } },
      })
    ).toEqual({ teamMemberId: "emp_1", companyId: "comp_A", role: "admin" });
  });

  it("a Team Member without is_admin is a member", () => {
    expect(
      companyContextFromCustomer({
        id: "cus_1",
        employee: { id: "emp_1", is_admin: false, company: { id: "comp_A" } },
      })!.role
    ).toBe("member");
  });
});
