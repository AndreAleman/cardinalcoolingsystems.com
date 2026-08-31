import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { buildQuoteCartStep } from "../steps/build-quote-cart";

export type CreateQuoteCartWorkflowInput = {
  region_id: string;
  customer_id: string;
  items: { variant_id: string; quantity: number }[];
};

export const createQuoteCartWorkflow = createWorkflow<
  CreateQuoteCartWorkflowInput,
  { cart_id: string },
  []
>("create-quote-cart", function (input: CreateQuoteCartWorkflowInput) {
  return new WorkflowResponse(buildQuoteCartStep(input));
});
