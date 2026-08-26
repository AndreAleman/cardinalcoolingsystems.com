import { ICustomerModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/* Put a customer into their Company's Customer Group (prices, codes). */
export const joinCompanyCustomerGroupStep = createStep(
  "join-company-customer-group",
  async (input: { company_id: string; customer_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "customer_group.id"],
      filters: { id: input.company_id },
    });
    const groupId = (company as any)?.customer_group?.id as string | undefined;
    if (!groupId) return new StepResponse(null, null);

    const customerService = container.resolve<ICustomerModuleService>(Modules.CUSTOMER);
    await customerService.addCustomerToGroup({
      customer_id: input.customer_id,
      customer_group_id: groupId,
    });
    return new StepResponse(groupId, { customer_id: input.customer_id, customer_group_id: groupId });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const customerService = container.resolve<ICustomerModuleService>(Modules.CUSTOMER);
    await customerService.removeCustomerFromGroup(prev);
  }
);
