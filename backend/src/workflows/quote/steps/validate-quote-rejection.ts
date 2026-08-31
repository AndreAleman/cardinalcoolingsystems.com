import { MedusaError } from "@medusajs/framework/utils";
import { createStep } from "@medusajs/framework/workflows-sdk";
import { QueryQuote } from "../../../modules/quote/types";

/* An accepted quote is final — it already promoted a real Order. */
export const validateQuoteRejectionStep = createStep(
  "validate-quote-rejection-step",
  async function ({ quote }: { quote: QueryQuote }) {
    if (["accepted"].includes(quote.status)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Quote is already accepted by customer`
      );
    }
  }
);
