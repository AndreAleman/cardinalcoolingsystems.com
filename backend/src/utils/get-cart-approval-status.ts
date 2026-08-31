import { ApprovalStatusType } from "../modules/approval/types";

/*
  Read a cart's approval posture off its linked Approval rows (fetched
  as cart.approvals.* via the cart-approvals link). Pending wins over
  everything: one pending Approval freezes the cart.
*/

type QueryApproval = {
  id: string;
  status: ApprovalStatusType | string;
};

export const getCartApprovalStatus = (cart: Record<string, any> | null) => {
  const defaultStatus = {
    isPendingApproval: false,
    isApproved: false,
    isRejected: false,
  };

  if (!cart?.approvals?.length) return defaultStatus;

  const approvals = (cart.approvals as (QueryApproval | null)[]).filter(
    Boolean
  ) as QueryApproval[];

  const isPendingApproval = approvals.some(
    (approval) => approval.status === ApprovalStatusType.PENDING
  );

  if (isPendingApproval) {
    return { ...defaultStatus, isPendingApproval: true };
  }

  const isApproved = approvals.some(
    (approval) => approval.status === ApprovalStatusType.APPROVED
  );

  if (isApproved) {
    return { ...defaultStatus, isApproved: true };
  }

  const isRejected = approvals.some(
    (approval) => approval.status === ApprovalStatusType.REJECTED
  );

  return { ...defaultStatus, isRejected };
};
