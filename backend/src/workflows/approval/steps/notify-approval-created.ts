import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import type { EmailItem } from "../../../modules/email-notifications/templates/base";
import { EmailTemplates } from "../../../modules/email-notifications/templates";
import { STOREFRONT_URL } from "../../../lib/constants";

/*
  When a member's submission gets held for approval, notify every
  admin + manager Team Member in the Company so someone can action it
  ("approval-requested" template).

  Recipient resolution: cart.metadata.company_id (stamped by the
  order-form submit) → company.employees with role IN ('admin',
  'manager') → each employee's linked customer email.

  Best-effort like every other email step: if the notification module
  isn't registered (RESEND_* env vars unset) or a send fails, log and
  return — a missed email must never un-create an approval that's
  already in the DB.
*/

type Input = {
  cart_id: string;
  submitter_customer_id: string;
};

type Output = {
  sent: boolean;
  notified_count: number;
};

export const notifyApprovalCreatedStep = createStep(
  "notify-approval-created",
  async ({ cart_id, submitter_customer_id }: Input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const tag = "[approval] notify-approval-created";

    let notificationModule: any;
    try {
      notificationModule = container.resolve(Modules.NOTIFICATION);
    } catch {
      logger.warn(`${tag}: Modules.NOTIFICATION not registered; skipping.`);
      return new StepResponse<Output>({ sent: false, notified_count: 0 });
    }

    try {
      const query = container.resolve(ContainerRegistrationKeys.QUERY);

      // 1. Cart → company_id (stamped on metadata by the order-form
      //    submit) + line items for the email body (SKU + qty, no prices).
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "metadata",
          "items.id",
          "items.title",
          "items.quantity",
          "items.variant_sku",
        ],
        filters: { id: cart_id },
      });
      const cart = carts?.[0] as any;
      const cartCompanyId = (cart?.metadata ?? {}).company_id as
        | string
        | undefined;
      const items: EmailItem[] = ((cart?.items ?? []) as any[]).map((it) => ({
        sku: (it?.variant_sku as string) || "(no SKU)",
        title: (it?.title as string) || null,
        qty: Number(it?.quantity ?? 0),
      }));

      if (!cartCompanyId) {
        logger.warn(
          `${tag}: cart ${cart_id} has no company_id; cannot resolve recipients.`
        );
        return new StepResponse<Output>({ sent: false, notified_count: 0 });
      }

      // 2. Submitter's name for the email body.
      const { data: submitters } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name"],
        filters: { id: submitter_customer_id },
      });
      const submitter = submitters?.[0] as any;
      const submitterName =
        [submitter?.first_name, submitter?.last_name]
          .filter(Boolean)
          .join(" ") ||
        submitter?.email ||
        "A team member";

      // 3. Eligible approvers: every admin + manager Team Member in the
      //    Company, with their linked customer email.
      const { data: companies } = await query.graph({
        entity: "company",
        fields: [
          "id",
          "name",
          "employees.id",
          "employees.role",
          "employees.customer.id",
          "employees.customer.email",
        ],
        filters: { id: cartCompanyId },
      });
      const company = companies?.[0] as any;
      const employees: any[] = company?.employees ?? [];
      const approvers = employees.filter(
        (e) => e?.role === "admin" || e?.role === "manager"
      );

      if (approvers.length === 0) {
        logger.warn(
          `${tag}: no admin/manager recipients found for cart ${cart_id} (company ${cartCompanyId}).`
        );
        return new StepResponse<Output>({ sent: false, notified_count: 0 });
      }

      const reviewUrl = `${STOREFRONT_URL.replace(/\/+$/, "")}/us/account`;

      let notified = 0;
      for (const approver of approvers) {
        const toEmail = approver?.customer?.email;
        if (!toEmail) continue;
        try {
          await notificationModule.createNotifications({
            to: toEmail,
            channel: "email",
            template: EmailTemplates.APPROVAL_REQUESTED,
            data: {
              submitterName,
              companyName: company?.name ?? "your team",
              items,
              reviewUrl,
            },
          });
          notified++;
        } catch (err: any) {
          logger.error(
            `${tag}: send to ${toEmail} failed: ${err?.message ?? err}`
          );
        }
      }

      logger.info(
        `${tag}: notified ${notified}/${approvers.length} approvers for cart ${cart_id}.`
      );
      return new StepResponse<Output>({
        sent: notified > 0,
        notified_count: notified,
      });
    } catch (err: any) {
      logger.error(`${tag}: failed: ${err?.message ?? err}`);
      return new StepResponse<Output>({ sent: false, notified_count: 0 });
    }
  }
);
