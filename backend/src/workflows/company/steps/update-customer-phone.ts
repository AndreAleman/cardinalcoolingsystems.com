import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

/*
  Keep the phone from the membership request on the customer too, so
  Cardinal can call the requester from either record. Compensation
  restores the previous value.
*/

type Input = {
  customer_id: string;
  phone: string;
};

type CompensationData = {
  customer_id: string;
  previousPhone: string | null;
};

export const updateCustomerPhoneStep = createStep(
  "update-customer-phone",
  async ({ customer_id, phone }: Input, { container }) => {
    const customerModule = container.resolve(Modules.CUSTOMER);
    const existing = await customerModule.retrieveCustomer(customer_id);

    await customerModule.updateCustomers(customer_id, { phone });

    return new StepResponse<{ customer_id: string }, CompensationData>(
      { customer_id },
      { customer_id, previousPhone: existing.phone ?? null }
    );
  },
  async (compensationData, { container }) => {
    if (!compensationData) return;
    const customerModule = container.resolve(Modules.CUSTOMER);
    await customerModule.updateCustomers(compensationData.customer_id, {
      phone: compensationData.previousPhone,
    });
  }
);
