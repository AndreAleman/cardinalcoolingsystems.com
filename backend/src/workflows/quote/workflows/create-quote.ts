import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleCreateQuote, ModuleQuote } from "../../../modules/quote/types";
import { createQuotesStep } from "../steps/create-quotes";

// Explicit generics: inferred workflow types are not portable under pnpm
// and break `medusa build` declaration emit (see commit 98fb1a1).
export const createQuotesWorkflow = createWorkflow<
  ModuleCreateQuote[],
  ModuleQuote[],
  []
>("create-quotes-workflow", function (input: ModuleCreateQuote[]) {
  return new WorkflowResponse(createQuotesStep(input));
});
