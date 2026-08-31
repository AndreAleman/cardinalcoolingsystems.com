import {
  convertItemResponseToUpdateRequest,
  getSelectsAndRelationsFromObjectArray,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { QUOTE_MODULE } from "../../../modules/quote";
import type QuoteModuleService from "../../../modules/quote/service";
import { ModuleQuote, ModuleUpdateQuote } from "../../../modules/quote/types";

/*
  A step to update a quote. Compensation restores the exact pre-update
  field values captured before the write.
*/
export const updateQuotesStep = createStep(
  "update-quotes",
  async (data: ModuleUpdateQuote[], { container }) => {
    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);
    const { selects, relations } = getSelectsAndRelationsFromObjectArray(data);

    const dataBeforeUpdate = await quoteModule.listQuotes(
      { id: data.map((d) => d.id) },
      { relations, select: selects }
    );

    const updatedQuotes = (await quoteModule.updateQuotes(
      data
    )) as ModuleQuote[];

    return new StepResponse(updatedQuotes, {
      dataBeforeUpdate,
      selects,
      relations,
    });
  },
  async (revertInput, { container }) => {
    if (!revertInput) {
      return;
    }

    const quoteModule = container.resolve<QuoteModuleService>(QUOTE_MODULE);
    const { dataBeforeUpdate, selects, relations } = revertInput;

    await quoteModule.updateQuotes(
      dataBeforeUpdate.map((data) =>
        convertItemResponseToUpdateRequest(data, selects, relations)
      )
    );
  }
);
