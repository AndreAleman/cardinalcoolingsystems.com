import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { APPROVAL_MODULE } from "../../../modules/approval";
import type ApprovalModuleService from "../../../modules/approval/service";
import { ApprovalStatusType } from "../../../modules/approval/types";

/* Upsert the cart's single denormalized approval-status row to pending. */
export const createApprovalStatusStep = createStep(
  "create-approval-status",
  async (cartIds: string[], { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);

    const {
      data: [existingApprovalStatus],
    } = await query.graph({
      entity: "approval_status",
      fields: ["*"],
      filters: { cart_id: cartIds[0] },
    });

    if (existingApprovalStatus) {
      const [approvalStatus] = await approvalModule.updateApprovalStatuses([
        { id: existingApprovalStatus.id, status: ApprovalStatusType.PENDING },
      ]);
      return new StepResponse(approvalStatus, [approvalStatus.id]);
    }

    const [approvalStatus] = await approvalModule.createApprovalStatuses(
      cartIds.map((cartId) => ({
        cart_id: cartId,
        status: ApprovalStatusType.PENDING,
      }))
    );

    return new StepResponse(approvalStatus, [approvalStatus.id]);
  },
  async (statusIds, { container }) => {
    if (!statusIds) return;
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);
    await approvalModule.deleteApprovalStatuses(statusIds);
  }
);
