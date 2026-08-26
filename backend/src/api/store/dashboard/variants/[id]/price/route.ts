import type { IPricingModuleService, MedusaContainer } from "@medusajs/framework/types";
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../../../middlewares/ensure-company-approved";

/*
  Price a Variant for a Company Customer Group. The caller supplies a
  Variant ID only; the Company group comes from their authenticated
  Team Member's server-side context.
*/
export async function calculateCompanyVariantPrice(
  container: MedusaContainer,
  variantId: string,
  customerGroupId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [variant],
  } = await query.graph(
    {
      entity: "product_variant",
      fields: ["id", "price_set.id"],
      filters: { id: variantId },
    },
    { throwIfKeyNotFound: true }
  );

  const priceSetId = (variant as any)?.price_set?.id as string | undefined;
  if (!priceSetId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "This Variant has no price");
  }

  const pricing = container.resolve<IPricingModuleService>(Modules.PRICING);
  const [price] = await pricing.calculatePrices(
    { id: [priceSetId] },
    {
      context: {
        currency_code: "usd",
        // Matching Medusa's price-list rule attribute exactly.
        "customer.groups.id": customerGroupId,
      },
    }
  );

  if (price?.calculated_amount == null || !price.currency_code) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No price is available for this Variant");
  }

  return {
    variant_id: variantId,
    amount: Number(price.calculated_amount),
    currency_code: price.currency_code,
    price_list_id: price.calculated_price?.price_list_id ?? null,
  };
}

/* GET /store/dashboard/variants/:id/price — caller's Company price only. */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ctx = (req as CompanyRequest).company_context;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: ["id", "customer_group.id"],
    filters: { id: ctx.companyId },
  });
  const customerGroupId = (company as any)?.customer_group?.id as string | undefined;

  if (!customerGroupId) {
    return res.status(404).json({ message: "This Company has no Customer Group" });
  }

  res.json(await calculateCompanyVariantPrice(req.scope, req.params.id, customerGroupId));
};
