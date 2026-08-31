import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { STOREFRONT_URL } from "../../../lib/constants";
import type { QuoteEmailItem } from "./send-quote-client-email";

/*
  Runs at the end of customerAcceptQuoteWorkflow, after the draft order
  is promoted to PENDING. Sends the customer their order confirmation
  ("quote-accepted-client" template): order id, PO number, itemized
  SKU + qty list (no prices), CTA to their portal order page.

  Best-effort like every other email step: if the notification module
  isn't registered or the send fails, log and return — a missing email
  must never roll back an accepted quote.

  Recipient: order.email, falling back to customer.email. PO number:
  order.metadata.po_number (stamped by updateOrderWorkflow earlier in
  this same workflow), falling back to the po_number workflow input.
*/

type Input = {
  order_id: string;
  po_number?: string | null;
};

type Output = {
  sent: boolean;
  to?: string;
};

export const sendQuoteAcceptedClientEmailStep = createStep(
  "send-quote-accepted-client-email",
  async ({ order_id, po_number }: Input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const tag = "[quote] send-quote-accepted-client-email";

    let notificationModule: any;
    try {
      notificationModule = container.resolve(Modules.NOTIFICATION);
    } catch {
      logger.warn(`${tag}: Modules.NOTIFICATION not registered; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "metadata",
        "customer.email",
        "customer.first_name",
        "items.title",
        "items.quantity",
        "items.variant_sku",
      ],
      filters: { id: order_id },
    });
    const order = orders?.[0] as any;

    if (!order) {
      logger.warn(`${tag}: order ${order_id} not found; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    const toEmail =
      (order?.email as string) || (order?.customer?.email as string);
    if (!toEmail) {
      logger.warn(`${tag}: order ${order_id} has no email; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    const items: QuoteEmailItem[] = ((order?.items ?? []) as any[]).map(
      (it) => ({
        sku: (it?.variant_sku as string) || "(no SKU)",
        title: (it?.title as string) || null,
        qty: Number(it?.quantity ?? 0),
      })
    );

    const displayOrderId = order?.display_id
      ? String(order.display_id)
      : order_id;
    const customerFirstName = (order?.customer?.first_name as string) || null;
    const poNumber = (order?.metadata?.po_number as string) || po_number || null;

    const orderUrl = `${STOREFRONT_URL.replace(/\/+$/, "")}/us/account/orders/${order_id}`;

    try {
      await notificationModule.createNotifications({
        to: toEmail,
        channel: "email",
        template: "quote-accepted-client",
        data: {
          customerFirstName,
          displayOrderId,
          poNumber,
          items,
          orderUrl,
        },
      });
      logger.info(
        `${tag}: sent order confirmation to ${toEmail} for order ${order_id}.`
      );
      return new StepResponse<Output>({ sent: true, to: toEmail });
    } catch (err: any) {
      logger.error(`${tag}: send to ${toEmail} failed: ${err?.message ?? err}`);
      return new StepResponse<Output>({ sent: false, to: toEmail });
    }
  }
);
