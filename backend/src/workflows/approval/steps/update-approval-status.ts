import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { APPROVAL_MODULE } from "../../../modules/approval";
import type ApprovalModuleService from "../../../modules/approval/service";
import { ApprovalStatusType } from "../../../modules/approval/types";
import type { ApprovalRow } from "./update-approval";

/*
  Sync the cart's single denormalized approval-status row after an
  Approval was decided. Approved only lands once NO pending Approval
  remains on the cart; rejected lands immediately (rejecting one
  rejects them all — see update-approval).
*/
export const updateApprovalStatusStep = createStep(
  "update-approval-status",
  async (input: ApprovalRow, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);

    const {
      data: [approvalStatus],
    } = await query.graph({
      entity: "approval_status",
      fields: ["id", "status"],
      filters: { cart_id: input.cart_id },
    });

    if (!approvalStatus) {
      return new StepResponse(undefined, null);
    }

    const previousData = {
      id: approvalStatus.id as string,
      status: approvalStatus.status as ApprovalStatusType,
    };

    const hasPendingApprovals = await approvalModule.hasPendingApprovals(
      input.cart_id
    );

    if (input.status === ApprovalStatusType.APPROVED && !hasPendingApprovals) {
      await approvalModule.updateApprovalStatuses([
        { id: approvalStatus.id, status: ApprovalStatusType.APPROVED },
      ]);
    }

    if (input.status === ApprovalStatusType.REJECTED) {
      await approvalModule.updateApprovalStatuses([
        { id: approvalStatus.id, status: ApprovalStatusType.REJECTED },
      ]);
    }

    return new StepResponse(undefined, previousData);
  },
  async (previousData, { container }) => {
    if (!previousData) return;
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);
    await approvalModule.updateApprovalStatuses([previousData]);
  }
);
