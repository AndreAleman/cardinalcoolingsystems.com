import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { APPROVAL_MODULE } from "../../../modules/approval";
import type ApprovalModuleService from "../../../modules/approval/service";
import {
  ApprovalStatusType,
  ApprovalType,
} from "../../../modules/approval/types";

export type CreateApprovalInput = {
  cart_id: string;
  type: ApprovalType;
  created_by: string;
};

/*
  Create the pending Approval rows for a cart. Guards:
  - a cart with a pending or approved status never gets a second Approval;
  - the Company must actually have the Approval Setting switched on.
  Status is set explicitly (fresh approvals always start pending).
*/
export const createApprovalStep = createStep(
  "create-approval",
  async (
    input: CreateApprovalInput | CreateApprovalInput[],
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const approvalData = Array.isArray(input) ? input : [input];

    const {
      data: [cart],
    } = await query.graph(
      {
        entity: "cart",
        fields: ["id", "metadata", "approval_status.*", "company.id"],
        filters: { id: approvalData[0].cart_id },
      },
      { throwIfKeyNotFound: true }
    );

    const cartStatus = (cart as any).approval_status
      ?.status as ApprovalStatusType | undefined;
    if (cartStatus === ApprovalStatusType.PENDING) {
      throw new Error("Cart already has a pending approval");
    }
    if (cartStatus === ApprovalStatusType.APPROVED) {
      throw new Error("Cart is already approved");
    }

    // The chain cart→company→approval_settings silently drops the
    // relation in the remote-query layer; fetch settings directly.
    // A held cart has no company link yet (createApprovalsWorkflow is
    // what creates it), so fall back to cart.metadata.company_id, which
    // the order-form submit stamps before approvals run.
    const companyId = ((cart as any)?.company?.id ??
      (cart as any)?.metadata?.company_id) as string | undefined;
    let requiresAdminApproval = false;
    if (companyId) {
      const { data: settings } = await query.graph({
        entity: "approval_settings",
        fields: ["id", "requires_admin_approval"],
        filters: { company_id: companyId } as any,
      });
      requiresAdminApproval = Boolean(
        (settings?.[0] as any)?.requires_admin_approval
      );
    }

    if (!requiresAdminApproval) {
      throw new Error("Company does not require admin approval");
    }

    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);

    const approvals = await approvalModule.createApprovals(
      approvalData.map((data) => ({
        ...data,
        status: ApprovalStatusType.PENDING,
      }))
    );

    const created = Array.isArray(approvals) ? approvals : [approvals];
    return new StepResponse(
      // company_id rides along so the workflow can link cart↔company —
      // the queue route (GET /store/approvals) walks company.carts.
      created.map((approval) => ({ ...approval, company_id: companyId })),
      created.map((approval: { id: string }) => approval.id)
    );
  },
  async (approvalIds, { container }) => {
    if (!approvalIds) return;
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);
    await approvalModule.deleteApprovals(approvalIds);
  }
);
