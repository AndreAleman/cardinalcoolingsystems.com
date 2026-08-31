/*
  Spending-limit check for cart completion (CONTEXT.md "Approvals &
  Limits"). Employee.spending_limit of 0 means "no limit" — the default
  for every Team Member today, so this stays inert until Cardinal starts
  setting limits. The window the spend is summed over comes from the
  Company's spending_limit_reset_frequency.
*/

type SpendingLimitResetFrequency =
  | "never"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

type SpendWindowCompany = {
  spending_limit_reset_frequency?: SpendingLimitResetFrequency | null;
} | null;

type SpendEmployee = {
  spending_limit?: number | string | null;
  company?: SpendWindowCompany;
} | null;

type SpendOrder = {
  total?: number | string | null;
  created_at?: string | Date;
};

export function getSpendWindow(company: SpendWindowCompany): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const resetFrequency = company?.spending_limit_reset_frequency;

  switch (resetFrequency) {
    case "never":
      return { start: new Date(0), end: now };
    case "daily": {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return { start: startOfDay, end: now };
    }
    case "weekly": {
      // Window starts on Sunday.
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return { start: startOfWeek, end: now };
    }
    case "monthly":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    case "yearly":
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    default:
      // No Company / unknown value: treat as never resetting.
      return { start: new Date(0), end: now };
  }
}

export function getOrderTotalInSpendWindow(
  orders: SpendOrder[],
  spendWindow: { start: Date; end: Date }
): number {
  return orders.reduce((acc, order) => {
    const orderDate = new Date(order.created_at as string | Date);
    if (orderDate >= spendWindow.start && orderDate <= spendWindow.end) {
      return acc + Number(order.total ?? 0);
    }
    return acc;
  }, 0);
}

export function checkSpendingLimit(
  cart: { total?: number | string | null } | null,
  customer:
    | {
        employee?: SpendEmployee;
        orders?: SpendOrder[];
      }
    | null
): boolean {
  if (!cart || !customer?.employee) {
    return false;
  }

  const spendingLimit = Number(customer.employee.spending_limit ?? 0);
  // 0 = no limit (the default for every Team Member).
  if (!spendingLimit) {
    return false;
  }

  const spendWindow = getSpendWindow(customer.employee.company ?? null);
  const spent = getOrderTotalInSpendWindow(customer.orders ?? [], spendWindow);

  return spent + Number(cart.total ?? 0) > spendingLimit;
}
