/* Approval vocabulary — see CONTEXT.md "Approvals & Limits".
   Only admin approval exists; the reference project's sales-manager
   approval type was deliberately dropped (docs/specs/company-dashboard.md). */

export enum ApprovalType {
  ADMIN = "admin",
}

export enum ApprovalStatusType {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
