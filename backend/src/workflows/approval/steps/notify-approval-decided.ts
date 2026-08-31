import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { ApprovalStatusType } from "../../../modules/approval/types";
import type { EmailItem } from "../../../modules/email-notifications/templates/base";
import { EmailTemplates } from "../../../modules/email-notifications/templates";
import { STOREFRONT_URL } from "../../../lib/constants";

/*
  When an Approval flips to APPROVED or REJECTED, email the original
  submitter ("request-approved" / "request-rejected" templates). Two
  messages share one step — input.status decides.

  Recipient: the customer whose id is on Approval.created_by (set by
  createApprovalsWorkflow at submit time).

  Best-effort: if the notification module isn't registered or the send
  fails, log and return — the approval decision is already committed
  and must never be blocked by a failed email.
*/

type Input = {
  approval_id: string;
  status: ApprovalStatusType;
  handled_by_customer_id?: string;
};

type Output = {
  sent: boolean;
  to?: string;
};

export const notifyApprovalDecidedStep = createStep(
  "notify-approval-decided",
  async (
    { approval_id, status, handled_by_customer_id }: Input,
    { container }
  ) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const tag = "[approval] notify-approval-decided";

    let notificationModule: any;
    try {
      notificationModule = container.resolve(Modules.NOTIFICATION);
    } catch {
      logger.warn(`${tag}: Modules.NOTIFICATION not registered; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    try {
      const query = container.resolve(ContainerRegistrationKeys.QUERY);

      // 1. Approval → cart_id + created_by (the submitting customer).
      const { data: approvals } = await query.graph({
        entity: "approval",
        fields: ["id", "cart_id", "created_by"],
        filters: { id: approval_id },
      });
      const approval = approvals?.[0] as any;
      const submitterId = approval?.created_by as string | undefined;
      const cartId = approval?.cart_id as string | undefined;
      if (!submitterId) {
        logger.warn(
          `${tag}: approval ${approval_id} has no created_by; cannot resolve recipient.`
        );
        return new StepResponse<Output>({ sent: false });
      }

      // 2. Submitter's email + name.
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name"],
        filters: { id: submitterId },
      });
      const customer = customers?.[0] as any;
      const toEmail = customer?.email;
      if (!toEmail) {
        logger.warn(
          `${tag}: customer ${submitterId} has no email; cannot notify.`
        );
        return new StepResponse<Output>({ sent: false });
      }

      // 3. Optional: name of the Team Member who decided, for body copy.
      let approverName: string | null = null;
      if (handled_by_customer_id) {
        const { data: approvers } = await query.graph({
          entity: "customer",
          fields: ["first_name", "last_name", "email"],
          filters: { id: handled_by_customer_id },
        });
        const a = approvers?.[0] as any;
        approverName =
          [a?.first_name, a?.last_name].filter(Boolean).join(" ") ||
          a?.email ||
          null;
      }

      // 4. Cart line items for the email body (parts list, no prices).
      let items: EmailItem[] = [];
      if (cartId) {
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: [
            "id",
            "items.id",
            "items.title",
            "items.quantity",
            "items.variant_sku",
          ],
          filters: { id: cartId },
        });
        items = (((carts?.[0] as any)?.items ?? []) as any[]).map((it) => ({
          sku: (it?.variant_sku as string) || "(no SKU)",
          title: (it?.title as string) || null,
          qty: Number(it?.quantity ?? 0),
        }));
      }

      const isApproved = status === ApprovalStatusType.APPROVED;
      const dashboardUrl = `${STOREFRONT_URL.replace(/\/+$/, "")}/us/account`;

      await notificationModule.createNotifications({
        to: toEmail,
        channel: "email",
        template: isApproved
          ? EmailTemplates.REQUEST_APPROVED
          : EmailTemplates.REQUEST_REJECTED,
        data: {
          buyerFirstName: (customer?.first_name as string) || null,
          approverName,
          items,
          ctaHref: dashboardUrl,
          ctaLabel: "Open your Dashboard",
        },
      });
      logger.info(
        `${tag}: sent ${isApproved ? "approved" : "rejected"} email to ${toEmail} for approval ${approval_id}.`
      );
      return new StepResponse<Output>({ sent: true, to: toEmail });
    } catch (err: any) {
      logger.error(`${tag}: failed: ${err?.message ?? err}`);
      return new StepResponse<Output>({ sent: false });
    }
  }
);
