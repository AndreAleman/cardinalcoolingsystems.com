import { IPromotionModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import {
  welcomeCodeFor,
  WELCOME_CODE_PERCENT,
} from "../../../utils/welcome-code";

type Input = { company_id: string; company_name: string; customer_group_id: string };

/*
  The Welcome Code is a Medusa promotion: 10% off the order, usable
  once (campaign usage budget of 1), expiring in 30 days, and only for the Company's Customer Group.
*/
export const issueWelcomeCodeStep = createStep(
  "issue-welcome-code",
  async (input: Input, { container }) => {
    const promotionService: IPromotionModuleService = container.resolve(
      Modules.PROMOTION
    );
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const issuedAt = new Date();
    const { code, ends_at } = welcomeCodeFor(issuedAt);

    const promotion = await promotionService.createPromotions({
      code,
      type: "standard",
      status: "active",
      is_automatic: false,
      application_method: {
        type: "percentage",
        target_type: "order",
        allocation: "across",
        value: WELCOME_CODE_PERCENT,
        currency_code: "usd",
      },
      rules: [
        {
          attribute: "customer.groups.id",
          operator: "in",
          values: [input.customer_group_id],
        },
      ],
      campaign: {
        name: `Welcome — ${input.company_name}`,
        campaign_identifier: `welcome-${input.company_id}`,
        starts_at: issuedAt,
        ends_at,
        // Works once: a usage budget of 1.
        budget: { type: "usage", limit: 1 },
      },
    });

    await companyService.updateCompanies({ id: input.company_id, welcome_code: code });

    // Step outputs are serialized between steps, so dates travel as ISO strings.
    return new StepResponse(
      { code, ends_at: ends_at.toISOString() },
      { promotion_id: promotion.id, company_id: input.company_id }
    );
  },
  async (compensate, { container }) => {
    if (!compensate) return;
    const promotionService: IPromotionModuleService = container.resolve(
      Modules.PROMOTION
    );
    await promotionService.deletePromotions(compensate.promotion_id);
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateCompanies({ id: compensate.company_id, welcome_code: null });
  }
);
