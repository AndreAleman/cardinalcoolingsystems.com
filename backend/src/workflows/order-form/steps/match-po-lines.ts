import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { extractSkuTokens, matchLineToSku } from "../../../utils/po-match";
import type { ExtractedPo } from "./extract-po-document";

/*
  Turn extracted PO lines into the PO Read-Out: each line matched to a
  catalog variant (Cardinal's price + weight) or flagged unmatched, with
  a Price Alarm where the PO's unit price is LOWER than Cardinal's
  (a higher PO price is silently replaced by ours — CONTEXT.md).
*/

export type PoReadOutLine = {
  description: string;
  quantity: number;
  unit_price: number | null;
  variant: {
    id: string;
    sku: string;
    title: string;
    unit_price: number;
    weight_lbs: number | null;
  } | null;
  price_alarm: boolean;
  unmatched: boolean;
};

type Input = {
  extracted: ExtractedPo;
};

export const matchPoLinesStep = createStep(
  "match-po-lines",
  async ({ extracted }: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // One catalog query for every SKU-shaped token on the PO.
    const allTokens = [
      ...new Set(
        extracted.lines.flatMap((line) =>
          extractSkuTokens(line.sku_or_description)
        )
      ),
    ];

    const { data: variants } = allTokens.length
      ? await query.graph({
          entity: "variant",
          fields: [
            "id",
            "sku",
            "title",
            "weight",
            "prices.amount",
            "prices.currency_code",
          ],
          filters: { sku: allTokens },
        })
      : { data: [] };

    const variantBySku = new Map(
      (variants as any[])
        .filter((variant) => variant.sku)
        .map((variant) => [String(variant.sku).toUpperCase(), variant])
    );
    const catalogSkus = new Set(variantBySku.keys());

    const lines: PoReadOutLine[] = extracted.lines.map((line) => {
      const sku = matchLineToSku(line.sku_or_description, catalogSkus);
      const variant = sku ? variantBySku.get(sku) : null;

      if (!variant) {
        return {
          description: line.sku_or_description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          variant: null,
          price_alarm: false,
          unmatched: true,
        };
      }

      const usdPrice = ((variant.prices ?? []) as any[]).find(
        (price) => price.currency_code === "usd"
      );
      const ourPrice = Number(usdPrice?.amount ?? 0);

      return {
        description: line.sku_or_description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        variant: {
          id: variant.id,
          sku: variant.sku,
          title: variant.title,
          unit_price: ourPrice,
          weight_lbs: variant.weight ?? null,
        },
        price_alarm:
          line.unit_price !== null && ourPrice > 0 && line.unit_price < ourPrice,
        unmatched: false,
      };
    });

    return new StepResponse({ lines });
  }
);
