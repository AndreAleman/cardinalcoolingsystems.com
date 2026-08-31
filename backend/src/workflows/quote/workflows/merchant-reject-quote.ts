import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { QueryQuote } from "../../../modules/quote/types";
import { validateQuoteRejectionStep } from "../steps/validate-quote-rejection";
import { updateQuotesWorkflow } from "./update-quote";

/*
  Cardinal rejects a Quote: status flips to merchant_rejected. Refused
  once the customer has accepted — that quote already promoted an Order.
*/
export const merchantRejectQuoteWorkflow = createWorkflow<
  { quote_id: string },
  void,
  []
>("merchant-reject-quote-workflow", function (input: { quote_id: string }) {
  const quote: QueryQuote = useRemoteQueryStep({
    entry_point: "quote",
    fields: ["id", "status"],
    variables: { id: input.quote_id },
    list: false,
    throw_if_key_not_found: true,
  });

  validateQuoteRejectionStep({ quote });

  updateQuotesWorkflow.runAsStep({
    input: [
      {
        id: input.quote_id,
        status: "merchant_rejected" as const,
      },
    ],
  });

  return new WorkflowResponse(void 0);
});
