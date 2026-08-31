import { IOrderModuleService } from "@medusajs/framework/types";
import {
  convertItemResponseToUpdateRequest,
  getSelectsAndRelationsFromObjectArray,
  Modules,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/*
  A step to update the order — used by the quote workflows to promote a
  draft order to a real pending Order. Compensation restores the fields
  captured before the write.
*/
export const updateOrderStep = createStep(
  "update-order",
  async (
    data: {
      id: string;
      is_draft_order: boolean;
      status: string;
      metadata?: Record<string, unknown>;
    },
    { container }
  ) => {
    const { id, ...rest } = data;
    const orderModule: IOrderModuleService = container.resolve(Modules.ORDER);

    const { selects, relations } = getSelectsAndRelationsFromObjectArray([
      data,
    ]);

    const dataBeforeUpdate = await orderModule.listOrders(
      { id: data.id },
      { relations, select: selects }
    );

    // updateOrders REPLACES metadata wholesale. Merge with the stored
    // object so a partial write (e.g. stamping po_number at quote
    // acceptance) can't wipe existing keys like company_id.
    if (rest.metadata) {
      const [existing] = await orderModule.listOrders(
        { id: data.id },
        { select: ["id", "metadata"] }
      );
      rest.metadata = { ...(existing?.metadata ?? {}), ...rest.metadata };
    }

    const updatedOrder = await orderModule.updateOrders(id, rest as any);

    return new StepResponse(updatedOrder, {
      dataBeforeUpdate,
      selects,
      relations,
    });
  },
  async (revertInput, { container }) => {
    if (!revertInput) {
      return;
    }

    const { dataBeforeUpdate, selects, relations } = revertInput;
    const orderModule: IOrderModuleService = container.resolve(Modules.ORDER);

    await orderModule.updateOrders(
      dataBeforeUpdate.map((data) =>
        convertItemResponseToUpdateRequest(data, selects, relations)
      ) as any
    );
  }
);
