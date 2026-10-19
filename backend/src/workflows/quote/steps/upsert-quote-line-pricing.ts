import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { QUOTE_MODULE } from "../../../modules/quote";
import type QuoteModuleService from "../../../modules/quote/service";
import { ModuleQuoteLinePricing } from "../../../modules/quote/types";
import { computeSellPrice } from "../utils/markup";

/*
  Upsert internal cost/markup rows for quote lines (LinePricing —
  ADMIN-ONLY, never serialized on /store).

  computeSellPrice doubles as input validation: it throws on negative
  or non-finite cost/markup before anything is written. Compensation
  restores the exact prior state (delete created rows, revert updated
  ones).
*/
export type QuoteLinePricingInput = {
  item_id: string;
  cost: number;
  markup_pct: number;
  /* Plan B6. Omitted = unchanged, null = cleared. */
  benchmark_price?: number | null;
  benchmark_source?: string | null;
  approved_price?: number | null;
};

const B6_FIELDS = ["benchmark_price", "benchmark_source", "approved_price"] as const;

/* Only the B6 fields the caller sent (undefined = leave as is). */
const b6Patch = (item: QuoteLinePricingInput) =>
  Object.fromEntries(
    B6_FIELDS.filter((k) => item[k] !== undefined).map((k) => [k, item[k]])
  );

export const upsertQuoteLinePricingStep = createStep(
  "upsert-quote-line-pricing",
  async (
    input: {
      quote_id: string;
      items: QuoteLinePricingInput[];
    },
    { container }
  ) => {
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);

    for (const item of input.items) {
      computeSellPrice(item.cost, item.markup_pct);
    }

    const existing = (await quoteModule.listLinePricings({
      quote_id: input.quote_id,
      item_id: input.items.map((item) => item.item_id),
    })) as ModuleQuoteLinePricing[];
    const existingByItem = new Map(existing.map((row) => [row.item_id, row]));

    const toCreate = input.items.filter(
      (item) => !existingByItem.has(item.item_id)
    );
    const toUpdate = input.items.filter((item) =>
      existingByItem.has(item.item_id)
    );

    const created = toCreate.length
      ? ((await quoteModule.createLinePricings(
          toCreate.map((item) => ({
            quote_id: input.quote_id,
            item_id: item.item_id,
            cost: item.cost,
            markup_pct: item.markup_pct,
            ...b6Patch(item),
          }))
        )) as ModuleQuoteLinePricing[])
      : [];

    const updated = toUpdate.length
      ? ((await quoteModule.updateLinePricings(
          toUpdate.map((item) => ({
            id: existingByItem.get(item.item_id)!.id,
            cost: item.cost,
            markup_pct: item.markup_pct,
            ...b6Patch(item),
          }))
        )) as ModuleQuoteLinePricing[])
      : [];

    return new StepResponse([...created, ...updated], {
      created_ids: created.map((row) => row.id),
      previous: toUpdate.map((item) => {
        const row = existingByItem.get(item.item_id)!;
        return {
          id: row.id,
          cost: row.cost,
          markup_pct: row.markup_pct,
          benchmark_price: row.benchmark_price ?? null,
          benchmark_source: row.benchmark_source ?? null,
          approved_price: row.approved_price ?? null,
        };
      }),
    });
  },
  async (revert, { container }) => {
    if (!revert) return;
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);

    if (revert.created_ids.length) {
      await quoteModule.deleteLinePricings(revert.created_ids);
    }
    if (revert.previous.length) {
      await quoteModule.updateLinePricings(revert.previous);
    }
  }
);

export type UpsertQuoteLinePricingResult = ModuleQuoteLinePricing[];
