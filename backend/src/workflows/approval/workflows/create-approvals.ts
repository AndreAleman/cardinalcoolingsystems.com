import { Modules } from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { APPROVAL_MODULE } from "../../../modules/approval";
import { COMPANY_MODULE } from "../../../modules/company";
import {
  createApprovalStep,
  CreateApprovalInput,
} from "../steps/create-approval";
import { createApprovalStatusStep } from "../steps/create-approval-status";
import { notifyApprovalCreatedStep } from "../steps/notify-approval-created";

/*
  Hold a cart for admin approval: create the Approval row(s), upsert the
  cart's approval-status row to pending, and link both to the cart so the
  cart-mutation hooks can freeze it.
*/
export const createApprovalsWorkflow = createWorkflow<
  CreateApprovalInput | CreateApprovalInput[],
  { id: string; cart_id: string }[],
  []
>("create-approvals", function (input) {
  const result = createApprovalStep(input);

  const cartIds = transform(input, (input) => {
    const approvals = Array.isArray(input) ? input : [input];
    return approvals.map((approval) => approval.cart_id);
  });

  const approvalStatusResult = createApprovalStatusStep(cartIds);

  const approvalLinkData = transform(result, (approvals) => {
    return approvals.map((approval) => ({
      [Modules.CART]: { cart_id: approval.cart_id },
      [APPROVAL_MODULE]: { approval_id: approval.id },
    }));
  });

  const approvalStatusLinkData = transform(approvalStatusResult, (status) => {
    const statuses = Array.isArray(status) ? status : [status];
    return statuses.map((status) => ({
      [Modules.CART]: { cart_id: status.cart_id },
      [APPROVAL_MODULE]: { approval_status_id: status.id },
    }));
  });

  // Held carts also get the company↔cart link here (nothing else
  // creates it on the held path) so GET /store/approvals can walk
  // company.carts to scope the queue.
  const companyLinkData = transform(result, (approvals) =>
    approvals
      .filter((approval: any) => Boolean(approval.company_id))
      .map((approval: any) => ({
        [COMPANY_MODULE]: { company_id: approval.company_id },
        [Modules.CART]: { cart_id: approval.cart_id },
      }))
  );

  const linkData = transform(
    [approvalLinkData, approvalStatusLinkData, companyLinkData],
    (data) => data.flat()
  );

  createRemoteLinkStep(linkData);

  // Notify the Company's admin + manager Team Members that a
  // submission awaits approval. Best-effort (no-op when RESEND_* env
  // vars are unset). Single-notification: input is only ever a single
  // approval (or a one-entry array) today.
  notifyApprovalCreatedStep(
    transform(input, (input) => {
      const first = Array.isArray(input) ? input[0] : input;
      return {
        cart_id: first.cart_id,
        submitter_customer_id: first.created_by,
      };
    })
  );

  return new WorkflowResponse(result);
});
