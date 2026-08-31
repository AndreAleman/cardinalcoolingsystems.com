import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { BACKEND_URL } from "../../../lib/constants";

/*
  Notify Cardinal that a new Quote Request / order landed in admin.

  Recipient: OPERATOR_NOTIFICATION_EMAIL, falling back to ADMIN_EMAIL
  (the inbox the existing order alerts already use). Best-effort: a
  failed email never blocks the order, quote, or approval it is about
  (docs/specs/company-dashboard.md story 88).
*/

export type OperatorNotificationItem = {
  sku: string;
  title: string | null;
  qty: number;
};

type Input = {
  cart_id: string;
  customer_id: string;
  request_type:
    | "quote"
    | "order"
    | "quote-accepted"
    | "quote-rejected"
    | "quote-message";
  /** Customer's message body — only meaningful for "quote-message". */
  message_text?: string | null;
  /** Deep-link target: quote.id or order.id; null falls back to the list. */
  admin_target_id?: string | null;
};

type Output = {
  sent: boolean;
  to?: string;
};

const ADMIN_URL =
  process.env.MEDUSA_ADMIN_URL ?? `${BACKEND_URL.replace(/\/+$/, "")}/app`;

export const sendOperatorNotificationStep = createStep(
  "send-operator-notification",
  async (
    { cart_id, customer_id, request_type, admin_target_id, message_text }: Input,
    { container }
  ) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    const operatorEmail =
      process.env.OPERATOR_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
    if (!operatorEmail) {
      logger.info(
        "[order-form] send-operator-notification: no operator email configured; skipping."
      );
      return new StepResponse<Output>({ sent: false });
    }

    let notificationModule: any;
    try {
      notificationModule = container.resolve(Modules.NOTIFICATION);
    } catch {
      logger.warn(
        "[order-form] send-operator-notification: Modules.NOTIFICATION not registered; skipping."
      );
      return new StepResponse<Output>({ sent: false });
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

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
    const metadata = (cart?.metadata ?? {}) as Record<string, unknown>;
    const poNumber = (metadata.po_number as string) || null;
    const attnTo = (metadata.attn_to as string) || null;
    const notes = (metadata.notes as string) || null;
    const cartCompanyId = metadata.company_id as string | undefined;
    const items: OperatorNotificationItem[] = ((cart?.items ?? []) as any[]).map(
      (it) => ({
        sku: (it?.variant_sku as string) || "(no SKU)",
        title: (it?.title as string) || null,
        qty: Number(it?.quantity ?? 0),
      })
    );

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: customer_id },
    });
    const customer = customers?.[0] as any;
    const submitterName =
      [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
      customer?.email ||
      "A team member";

    let companyName = "their company";
    if (cartCompanyId) {
      const { data: companies } = await query.graph({
        entity: "company",
        fields: ["id", "name"],
        filters: { id: cartCompanyId },
      });
      companyName = (companies?.[0] as any)?.name ?? companyName;
    }

    const adminSection =
      request_type === "quote" ||
      request_type === "quote-rejected" ||
      request_type === "quote-message"
        ? "quotes"
        : "orders";
    const adminUrl = admin_target_id
      ? `${ADMIN_URL}/${adminSection}/${admin_target_id}`
      : `${ADMIN_URL}/${adminSection}`;

    try {
      await notificationModule.createNotifications({
        to: operatorEmail,
        channel: "email",
        template: "operator-notified",
        data: {
          requestType: request_type,
          submitterName,
          companyName,
          poNumber,
          attnTo,
          notes,
          items,
          adminUrl,
          messageText: message_text ?? null,
        },
      });
      logger.info(
        `[order-form] send-operator-notification: notified ${operatorEmail} of new ${request_type} from ${submitterName} (${companyName}).`
      );
      return new StepResponse<Output>({ sent: true, to: operatorEmail });
    } catch (err: any) {
      logger.error(
        `[order-form] send-operator-notification: send to ${operatorEmail} failed: ${err?.message ?? err}`
      );
      return new StepResponse<Output>({ sent: false, to: operatorEmail });
    }
  }
);
