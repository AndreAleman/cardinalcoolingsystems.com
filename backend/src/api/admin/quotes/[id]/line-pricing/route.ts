import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { IOrderModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { QUOTE_MODULE } from "../../../../../modules/quote";
import type QuoteModuleService from "../../../../../modules/quote/service";
import { ModuleQuoteLinePricing } from "../../../../../modules/quote/types";
import {
  computeQuoteTotals,
  computeSellPrice,
} from "../../../../../workflows/quote/utils/markup";
import { setQuoteLinePricingWorkflow } from "../../../../../workflows/quote/workflows";
import { AdminSetQuoteLinePricingType } from "../../validators";

/*
  Internal markup calculator (ADMIN ONLY — LinePricing never appears on
  any /store response).

  GET  /admin/quotes/:id/line-pricing → pricing rows + quote totals
  POST /admin/quotes/:id/line-pricing → upsert rows, return same shape

  Totals join the pricing rows against the live order-edit preview so
  total_sell always reflects the current (possibly staged) unit prices
  and quantities the customer would see — cost/markup/margin stay
  server-side and never leave the /admin surface.
*/

const buildPricingPayload = async (req: AuthenticatedMedusaRequest) => {
  const quoteModule = req.scope.resolve<QuoteModuleService>(QUOTE_MODULE);
  const orderModule: IOrderModuleService = req.scope.resolve(Modules.ORDER);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      fields: ["id", "draft_order_id"],
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  const [rows, preview] = await Promise.all([
    quoteModule.listLinePricings({ quote_id: id }) as Promise<
      ModuleQuoteLinePricing[]
    >,
    orderModule.previewOrderChange(quote.draft_order_id),
  ]);

  const rowByItem = new Map(rows.map((row) => [row.item_id, row]));

  const lines = ((preview.items ?? []) as any[])
    .filter((item: any) => Number(item.quantity) > 0)
    .map((item: any) => {
      const row = rowByItem.get(item.id);
      return {
        item_id: item.id,
        title: item.title,
        quantity: Number(item.quantity),
        sell_price: Number(item.unit_price) || 0,
        cost: row ? row.cost : null,
        markup_pct: row ? row.markup_pct : null,
        computed_sell:
          row != null ? computeSellPrice(row.cost, row.markup_pct) : null,
      };
    });

  return {
    line_pricings: lines,
    totals: computeQuoteTotals(lines),
  };
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  return res.json(await buildPricingPayload(req));
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetQuoteLinePricingType>,
  res: MedusaResponse
) => {
  await setQuoteLinePricingWorkflow(req.scope).run({
    input: {
      quote_id: req.params.id,
      items: req.validatedBody.prices.map((price) => ({
        item_id: price.item_id!,
        cost: price.cost!,
        markup_pct: price.markup_pct!,
      })),
    },
  });

  return res.json(await buildPricingPayload(req));
};
