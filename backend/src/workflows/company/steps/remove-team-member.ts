import type { ICustomerModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import { requireTeamMemberInCompany } from "./require-team-member";

/*
  Remove a Team Member: soft-delete, drop the Customer link, and leave
  the Company's Customer Group so Company prices and codes stop applying.
*/
export const removeTeamMemberStep = createStep(
  "remove-team-member",
  async (input: { company_id: string; employee_id: string }, { container }) => {
    await requireTeamMemberInCompany(container, input.company_id, input.employee_id);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const [{ data: [withCustomer] }, { data: [company] }] = await Promise.all([
      query.graph({ entity: "employee", fields: ["id", "customer.id"], filters: { id: input.employee_id } }),
      query.graph({ entity: "company", fields: ["id", "customer_group.id"], filters: { id: input.company_id } }),
    ]);
    const customerId = (withCustomer as any)?.customer?.id as string | undefined;
    const groupId = (company as any)?.customer_group?.id as string | undefined;

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
    const customerService = container.resolve<ICustomerModuleService>(Modules.CUSTOMER);
    if (customerId) {
      await remoteLink.dismiss({
        [COMPANY_MODULE]: { employee_id: input.employee_id },
        [Modules.CUSTOMER]: { customer_id: customerId },
      });
      if (groupId) {
        await customerService.removeCustomerFromGroup({ customer_id: customerId, customer_group_id: groupId });
      }
    }
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.softDeleteEmployees(input.employee_id);

    return new StepResponse(true, { employee_id: input.employee_id, customer_id: customerId, group_id: groupId });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.restoreEmployees(prev.employee_id);
    if (prev.customer_id) {
      const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
      await remoteLink.create({
        [COMPANY_MODULE]: { employee_id: prev.employee_id },
        [Modules.CUSTOMER]: { customer_id: prev.customer_id },
      });
      if (prev.group_id) {
        const customerService = container.resolve<ICustomerModuleService>(Modules.CUSTOMER);
        await customerService.addCustomerToGroup({ customer_id: prev.customer_id, customer_group_id: prev.group_id });
      }
    }
  }
);
