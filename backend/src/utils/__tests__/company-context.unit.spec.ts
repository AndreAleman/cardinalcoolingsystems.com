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
        employee: { id: "emp_1", role: "admin", company: null },
      })
    ).toBeNull();
  });

  it("returns the Company and the Team Member's Role", () => {
    expect(
      companyContextFromCustomer({
        id: "cus_1",
        employee: { id: "emp_1", role: "admin", company: { id: "comp_A" } },
      })
    ).toEqual({ teamMemberId: "emp_1", companyId: "comp_A", role: "admin" });
  });

  it("a manager is a manager", () => {
    expect(
      companyContextFromCustomer({
        id: "cus_1",
        employee: { id: "emp_1", role: "manager", company: { id: "comp_A" } },
      })!.role
    ).toBe("manager");
  });
});
