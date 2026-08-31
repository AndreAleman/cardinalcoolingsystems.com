import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { STOREFRONT_URL } from "../../../lib/constants";

/*
  Customer-facing quote lifecycle emails:
  - quote-received: "we got your Quote Request" (right after creation)
  - quote-ready:    Cardinal priced it; fires on every send incl. revisions

  Best-effort: failure logs and returns; it never rolls back a created
  or sent quote.
*/

export type QuoteEmailItem = {
  sku: string;
  title: string | null;
  qty: number;
};

type Input = {
  quote_id: string;
  template: "quote-received" | "quote-ready";
};

type Output = {
  sent: boolean;
  to?: string;
};

export const sendQuoteClientEmailStep = createStep(
  "send-quote-client-email",
  async ({ quote_id, template }: Input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const tag = `[quote] send-quote-client-email(${template})`;

    let notificationModule: any;
    try {
      notificationModule = container.resolve(Modules.NOTIFICATION);
    } catch {
      logger.warn(`${tag}: Modules.NOTIFICATION not registered; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: quotes } = await query.graph({
      entity: "quote",
      fields: ["id", "draft_order_id", "cart_id", "customer_id"],
      filters: { id: quote_id },
    });
    const quote = quotes?.[0] as any;
    if (!quote) {
      logger.warn(`${tag}: quote ${quote_id} not found; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "customer.email",
        "customer.first_name",
        "items.title",
        "items.quantity",
        "items.variant_sku",
      ],
      filters: { id: quote.draft_order_id },
    });
    const order = orders?.[0] as any;

    const toEmail =
      (order?.email as string) || (order?.customer?.email as string);
    if (!toEmail) {
      logger.warn(`${tag}: quote ${quote_id} has no customer email; skipping.`);
      return new StepResponse<Output>({ sent: false });
    }

    const items: QuoteEmailItem[] = ((order?.items ?? []) as any[]).map(
      (it) => ({
        sku: (it?.variant_sku as string) || "(no SKU)",
        title: (it?.title as string) || null,
        qty: Number(it?.quantity ?? 0),
      })
    );
    const customerFirstName = (order?.customer?.first_name as string) || null;

    // Submit-time metadata lives on the CART for quotes (copied to the
    // order only at acceptance).
    let poNumber: string | null = null;
    if (quote.cart_id) {
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: ["id", "metadata"],
        filters: { id: quote.cart_id },
      });
      poNumber =
        (((carts?.[0] as any)?.metadata ?? {}).po_number as string) || null;
    }

    const quoteUrl = `${STOREFRONT_URL.replace(/\/+$/, "")}/us/account/quotes/details/${quote_id}`;

    try {
      await notificationModule.createNotifications({
        to: toEmail,
        channel: "email",
        template,
        data: {
          customerFirstName,
          items,
          quoteUrl,
          poNumber,
        },
      });
      logger.info(`${tag}: sent to ${toEmail} for quote ${quote_id}.`);
      return new StepResponse<Output>({ sent: true, to: toEmail });
    } catch (err: any) {
      logger.error(`${tag}: send to ${toEmail} failed: ${err?.message ?? err}`);
      return new StepResponse<Output>({ sent: false, to: toEmail });
    }
  }
);
