import { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type Input = { company_name: string; customer_id: string };

/* The Company's own Customer Group, with its first Team Member in it. */
export const createCompanyCustomerGroupStep = createStep(
  "create-company-customer-group",
  async (input: Input, { container }) => {
    const customerService: ICustomerModuleService = container.resolve(
      Modules.CUSTOMER
    );
    const group = await customerService.createCustomerGroups({
      name: input.company_name,
    });
    await customerService.addCustomerToGroup({
      customer_id: input.customer_id,
      customer_group_id: group.id,
    });
    return new StepResponse(group, group.id);
  },
  async (groupId, { container }) => {
    if (!groupId) return;
    const customerService: ICustomerModuleService = container.resolve(
      Modules.CUSTOMER
    );
    await customerService.deleteCustomerGroups(groupId);
  }
);
