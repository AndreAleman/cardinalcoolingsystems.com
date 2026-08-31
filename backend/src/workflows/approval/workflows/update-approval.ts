import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ApprovalStatusType } from "../../../modules/approval/types";
import {
  updateApprovalStep,
  UpdateApprovalInput,
  ApprovalRow,
} from "../steps/update-approval";
import { updateApprovalStatusStep } from "../steps/update-approval-status";
import { notifyApprovalDecidedStep } from "../steps/notify-approval-decided";
import { resumeApprovedCartWorkflow } from "./resume-approved-cart";

/*
  Decide an Approval (approve/reject): update the Approval row itself,
  sync the cart's denormalized approval-status row, and on APPROVED
  resume the held cart through its original downstream pipeline.
  updateApprovalStep returns the approval with cart_id and created_by
  (= submitting customer's id), which is all the resume needs.

  After the resume branch, notify-approval-decided emails the original
  submitter with the outcome (best-effort).
*/
export const updateApprovalsWorkflow = createWorkflow<
  UpdateApprovalInput,
  ApprovalRow,
  []
>("update-approvals", function (input: UpdateApprovalInput) {
  const updatedApproval = updateApprovalStep(input);

  updateApprovalStatusStep(updatedApproval);

  when(
    "approval-status-approved",
    { input },
    ({ input }) => input.status === ApprovalStatusType.APPROVED
  ).then(() => {
    resumeApprovedCartWorkflow
      .runAsStep({
        input: transform({ updatedApproval }, ({ updatedApproval }) => ({
          cart_id: updatedApproval.cart_id,
          customer_id: updatedApproval.created_by,
        })),
      })
      .config({ name: "resume-approved-cart-on-approve" });
  });

  // Notify the original submitter on either decision — fires on BOTH
  // approved AND rejected (the step branches its template on
  // input.status). Best-effort: a failed email never blocks the
  // decision.
  notifyApprovalDecidedStep(
    transform({ input }, ({ input }) => ({
      approval_id: input.id,
      status: input.status,
      handled_by_customer_id: input.handled_by,
    }))
  );

  return new WorkflowResponse(updatedApproval);
});
