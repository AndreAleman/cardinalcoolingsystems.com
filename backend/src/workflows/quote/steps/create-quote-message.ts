import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { QUOTE_MODULE } from "../../../modules/quote";
import type QuoteModuleService from "../../../modules/quote/service";
import {
  ModuleCreateQuoteMessage,
  ModuleQuoteMessage,
} from "../../../modules/quote/types";

/*
  A step to create a Quote Message. Compensation deletes the created
  message if a later step fails.
*/
export const createQuoteMessageStep = createStep(
  "create-quote-message",
  async (
    input: ModuleCreateQuoteMessage,
    { container }
  ): Promise<StepResponse<ModuleQuoteMessage, string>> => {
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);

    const quoteMessage = (await quoteModule.createMessages(
      input
    )) as ModuleQuoteMessage;

    return new StepResponse(quoteMessage, quoteMessage.id);
  },
  async (id, { container }) => {
    if (!id) return;
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);

    await quoteModule.deleteMessages([id]);
  }
);
