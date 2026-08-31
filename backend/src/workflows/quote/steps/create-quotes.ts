import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { QUOTE_MODULE } from "../../../modules/quote";
import type QuoteModuleService from "../../../modules/quote/service";
import { ModuleCreateQuote, ModuleQuote } from "../../../modules/quote/types";

export const createQuotesStep = createStep(
  "create-quotes",
  async (
    input: ModuleCreateQuote[],
    { container }
  ): Promise<StepResponse<ModuleQuote[], string[]>> => {
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);

    const quotes = (await quoteModule.createQuotes(input)) as ModuleQuote[];

    return new StepResponse(
      quotes,
      quotes.map((quote) => quote.id)
    );
  },
  async (quoteIds, { container }) => {
    if (!quoteIds) return;
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);
    await quoteModule.deleteQuotes(quoteIds);
  }
);
