import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

/*
  Guest quotes need a Customer row for the quote/draft-order machinery.
  Look one up by email (lowercased — emailpass lookups are exact-string)
  or create an unregistered guest customer. Compensation deletes only a
  customer this step created.
*/

type Input = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company_name?: string;
};

type Output = {
  customer_id: string;
  email: string;
};

export const findOrCreateGuestCustomerStep = createStep(
  "find-or-create-guest-customer",
  async (input: Input, { container }) => {
    const customerModule = container.resolve(Modules.CUSTOMER);
    const email = input.email.trim().toLowerCase();

    const [existing] = await customerModule.listCustomers({ email });
    if (existing) {
      return new StepResponse<Output, string | null>(
        { customer_id: existing.id, email },
        null
      );
    }

    const created = await customerModule.createCustomers({
      email,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      company_name: input.company_name,
    });

    return new StepResponse<Output, string | null>(
      { customer_id: created.id, email },
      created.id
    );
  },
  async (createdCustomerId, { container }) => {
    if (!createdCustomerId) return;
    const customerModule = container.resolve(Modules.CUSTOMER);
    await customerModule.deleteCustomers(createdCustomerId);
  }
);
