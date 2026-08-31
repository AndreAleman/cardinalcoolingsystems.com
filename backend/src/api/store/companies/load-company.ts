import type { MedusaContainer, IPromotionModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { isWelcomeCodeLive } from "../../../utils/welcome-code-live";
import { COMPANY_FIELDS } from "./fields";

/*
  The Company as the storefront may see it. The Welcome Code is only
  reported while it is still live (unused and unexpired).
*/
export async function loadCompanyForStore(container: MedusaContainer, companyId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: COMPANY_FIELDS,
    filters: { id: companyId },
  });

  if (company?.welcome_code) {
    const promotionService = container.resolve<IPromotionModuleService>(Modules.PROMOTION);
    const [promotion] = await promotionService.listPromotions(
      { code: company.welcome_code },
      { relations: ["campaign", "campaign.budget"] }
    );
    if (!isWelcomeCodeLive(promotion, new Date())) {
      company.welcome_code = null;
    }
  }
  return company;
}
