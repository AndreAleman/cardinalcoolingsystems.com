import type { IPricingModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

type Input = { company_id: string; price_list_id: string | null };
type Compensation = { company_id: string; previous_price_list_id: string | null; customer_group_id: string };

/*
  A Company owns one Customer Group. Attaching a Custom Price List assigns that
  group as its sole eligibility rule, so it cannot leak to a different Company.
*/
export const assignCompanyPriceListStep = createStep(
  "assign-company-price-list",
  async (input: Input, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const company = await companyService.retrieveCompany(input.company_id);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const {
      data: [withGroup],
    } = await query.graph({
      entity: "company",
      fields: ["id", "customer_group.id"],
      filters: { id: input.company_id },
    });
    const customerGroupId = (withGroup as any)?.customer_group?.id as string | undefined;
    if (!customerGroupId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Company has no Customer Group");
    }

    const pricing = container.resolve<IPricingModuleService>(Modules.PRICING);
    if (input.price_list_id) {
      const priceList = await pricing.retrievePriceList(input.price_list_id, {
        relations: ["price_list_rules"],
      });
      if (priceList.type !== "override" || priceList.status !== "active") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Only active Custom (override) Price Lists can be assigned to a Company"
        );
      }
      const rules = priceList.price_list_rules ?? [];
      const isCurrentList = company.price_list_id === input.price_list_id;
      if (!isCurrentList && rules.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Choose a Custom Price List without rules; Cardinal assigns its Company rule automatically"
        );
      }
      await pricing.setPriceListRules({
        price_list_id: input.price_list_id,
        rules: { "customer.groups.id": [customerGroupId] },
      });
    }

    const previousPriceListId = company.price_list_id ?? null;
    if (previousPriceListId && previousPriceListId !== input.price_list_id) {
      await pricing.removePriceListRules({
        price_list_id: previousPriceListId,
        rules: ["customer.groups.id"],
      });
    }
    const updated = await companyService.updateCompanies({
      id: input.company_id,
      price_list_id: input.price_list_id,
    });
    return new StepResponse(updated, {
      company_id: input.company_id,
      previous_price_list_id: previousPriceListId,
      customer_group_id: customerGroupId,
    } satisfies Compensation);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const pricing = container.resolve<IPricingModuleService>(Modules.PRICING);
    const current = await companyService.retrieveCompany(previous.company_id);
    if (current.price_list_id && current.price_list_id !== previous.previous_price_list_id) {
      await pricing.removePriceListRules({
        price_list_id: current.price_list_id,
        rules: ["customer.groups.id"],
      });
    }
    if (previous.previous_price_list_id) {
      await pricing.setPriceListRules({
        price_list_id: previous.previous_price_list_id,
        rules: { "customer.groups.id": [previous.customer_group_id] },
      });
    }
    await companyService.updateCompanies({
      id: previous.company_id,
      price_list_id: previous.previous_price_list_id,
    });
  }
);
