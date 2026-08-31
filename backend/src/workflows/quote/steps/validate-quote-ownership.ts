import { MedusaError } from "@medusajs/framework/utils";
import { createStep } from "@medusajs/framework/workflows-sdk";
import { QueryQuote } from "../../../modules/quote/types";
import { isQuoteOwner } from "../utils/quote-ownership";

/*
  Ownership gate for customer-driven quote mutations (accept / reject).
  Without it any authenticated customer could act on any quote whose id
  they obtained — dashboardGate never relates the quote to the caller.
*/
export const validateQuoteOwnershipStep = createStep(
  "validate-quote-ownership-step",
  async function ({
    quote,
    customer_id,
  }: {
    quote: QueryQuote;
    customer_id: string;
  }) {
    if (!isQuoteOwner(quote, customer_id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Quote does not belong to this customer"
      );
    }
  }
);
