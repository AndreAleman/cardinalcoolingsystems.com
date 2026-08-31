import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { APPROVAL_MODULE } from "../../../modules/approval";
import type ApprovalModuleService from "../../../modules/approval/service";
import {
  ApprovalStatusType,
  ApprovalType,
} from "../../../modules/approval/types";

export type UpdateApprovalInput = {
  id: string;
  status: ApprovalStatusType;
  handled_by: string;
};

export type ApprovalRow = {
  id: string;
  cart_id: string;
  type: ApprovalType;
  status: ApprovalStatusType;
  created_by: string;
  handled_by: string | null;
};

/*
  Flip one Approval to approved/rejected and stamp who decided. A
  rejection also rejects every other Approval on the same cart, so the
  cart never stays half-decided. Compensation restores the previous
  status/handled_by.
*/
export const updateApprovalStep = createStep(
  "update-approval",
  async (input: UpdateApprovalInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);

    const {
      data: [approval],
    } = await query.graph(
      {
        entity: "approval",
        fields: ["*"],
        filters: { id: input.id },
      },
      { throwIfKeyNotFound: true }
    );

    if (input.status === ApprovalStatusType.REJECTED) {
      const { data: approvalsToReject } = await query.graph({
        entity: "approval",
        fields: ["id"],
        filters: {
          cart_id: (approval as any).cart_id,
          id: { $ne: (approval as any).id },
        } as any,
      });

      if (approvalsToReject.length) {
        await approvalModule.updateApprovals(
          approvalsToReject.map((sibling: any) => ({
            id: sibling.id,
            status: ApprovalStatusType.REJECTED,
            handled_by: input.handled_by,
          }))
        );
      }
    }

    const previousData: UpdateApprovalInput = {
      id: (approval as any).id,
      status: (approval as any).status as ApprovalStatusType,
      handled_by: (approval as any).handled_by,
    };

    const [updatedApproval] = await approvalModule.updateApprovals([input]);

    return new StepResponse(
      updatedApproval as unknown as ApprovalRow,
      previousData
    );
  },
  async (previousData, { container }) => {
    if (!previousData) return;
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);
    await approvalModule.updateApprovals([previousData]);
  }
);
