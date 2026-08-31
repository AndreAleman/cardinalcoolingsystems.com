import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleQuoteLinePricing } from "../../../modules/quote/types";
import { upsertQuoteLinePricingStep } from "../steps/upsert-quote-line-pricing";

export type SetQuoteLinePricingWorkflowInput = {
  quote_id: string;
  items: { item_id: string; cost: number; markup_pct: number }[];
};

/*
  Set internal cost/markup on quote lines (ADMIN ONLY).

  Stores LinePricing rows in the quote module. The customer-facing sell
  price is applied separately by the admin UI through the existing
  order-edit price update path — this workflow never touches the order.
*/
export const setQuoteLinePricingWorkflow = createWorkflow<
  SetQuoteLinePricingWorkflowInput,
  ModuleQuoteLinePricing[],
  []
>(
  "set-quote-line-pricing-workflow",
  function (input: SetQuoteLinePricingWorkflowInput) {
    // Existence check — throws 404-style if the quote id is bogus.
    useRemoteQueryStep({
      entry_point: "quote",
      fields: ["id"],
      variables: { id: input.quote_id },
      list: false,
      throw_if_key_not_found: true,
    });

    const rows = upsertQuoteLinePricingStep(input);

    return new WorkflowResponse(rows);
  }
);
