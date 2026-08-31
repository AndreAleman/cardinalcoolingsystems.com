import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleQuote, ModuleUpdateQuote } from "../../../modules/quote/types";
import { updateQuotesStep } from "../steps/update-quotes";

// Explicit generics: inferred workflow types are not portable under pnpm
// and break `medusa build` declaration emit (see commit 98fb1a1).
export const updateQuotesWorkflow = createWorkflow<
  ModuleUpdateQuote[],
  ModuleQuote[],
  []
>("update-quotes-workflow", function (input: ModuleUpdateQuote[]) {
  return new WorkflowResponse(updateQuotesStep(input));
});
