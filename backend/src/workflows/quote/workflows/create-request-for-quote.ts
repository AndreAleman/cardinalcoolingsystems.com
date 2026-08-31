import {
  beginOrderEditOrderWorkflow,
  createOrdersWorkflow,
  createRemoteLinkStep,
  useRemoteQueryStep,
} from "@medusajs/medusa/core-flows";
import { LinkDefinition } from "@medusajs/framework/types";
import { Modules, OrderStatus } from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ModuleQuote } from "../../../modules/quote/types";
import { createQuotesWorkflow } from "./create-quote";
import { createCustomDraftOrderStep } from "../steps/create-custom-draft-order";

/*
  Create a Quote Request: the cart is snapshotted into a draft Order, an
  order edit is opened on it (the merchant prices lines through the edit),
  and a Quote row ties cart + draft order + order change + customer
  together. Accept/reject workflows manage the lifecycle from there.

  The core orderCreated hook never fires on this path (it hangs off
  createOrderWorkflow, not createOrdersWorkflow), so the Company link is
  created here explicitly — the Company orders view depends on it.
*/
export const createRequestForQuoteWorkflow = createWorkflow<
  { cart_id: string; customer_id: string },
  { quote: ModuleQuote },
  []
>(
  "create-request-for-quote",
  function (input: { cart_id: string; customer_id: string }) {
    const cart = useRemoteQueryStep({
      entry_point: "cart",
      fields: [
        "id",
        "metadata",
        "sales_channel_id",
        "currency_code",
        "region_id",
        "customer.id",
        "customer.email",
        "shipping_address.*",
        "billing_address.*",
        "items.*",
        "shipping_methods.*",
        "promotions.code",
      ],
      variables: { id: input.cart_id },
      list: false,
      throw_if_key_not_found: true,
    });

    const customer = useRemoteQueryStep({
      entry_point: "customer",
      fields: ["id", "email"],
      variables: { id: input.customer_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "customer-query" });

    const orderInput = transform({ cart, customer }, ({ cart, customer }) => {
      // Carry the Company onto the order itself so the order↔company
      // link can be created below and downstream consumers (admin,
      // emails) don't need a join back to the cart.
      const orderMetadata: Record<string, unknown> = {};
      if (cart.metadata?.company_id) {
        orderMetadata.company_id = cart.metadata.company_id;
      }

      return {
        metadata: orderMetadata,
        is_draft_order: true,
        status: OrderStatus.DRAFT,
        sales_channel_id: cart.sales_channel_id,
        email: customer.email,
        customer_id: customer.id,
        billing_address: cart.billing_address,
        shipping_address: cart.shipping_address,
        items: cart.items,
        region_id: cart.region_id,
        promo_codes: (cart.promotions ?? []).map(
          ({ code }: { code: string }) => code
        ),
        currency_code: cart.currency_code,
        shipping_methods: cart.shipping_methods,
      };
    });

    // Quote carts hold only custom lines (no variant_id): the core
    // order workflow price-validates and inventory-reserves variant
    // items — the exact checks quote-only lines fail — and crashes on
    // an all-custom item list. Those carts create the draft order
    // through the order module instead.
    const hasVariantItems = transform({ cart }, ({ cart }) =>
      ((cart.items ?? []) as any[]).some((item) => Boolean(item.variant_id))
    );

    const coreDraftOrder = when(
      "rfq-core-order-path",
      { hasVariantItems },
      ({ hasVariantItems }) => hasVariantItems
    ).then(() =>
      createOrdersWorkflow.runAsStep({
        input: orderInput,
      })
    );

    const customDraftOrder = when(
      "rfq-custom-order-path",
      { hasVariantItems },
      ({ hasVariantItems }) => !hasVariantItems
    ).then(() =>
      createCustomDraftOrderStep({
        order: transform({ orderInput }, ({ orderInput }) => ({
          ...orderInput,
          items: (orderInput.items ?? []).map((item: any) => ({
            title: item.title,
            subtitle: item.subtitle ?? undefined,
            thumbnail: item.thumbnail ?? undefined,
            variant_sku: item.variant_sku ?? undefined,
            quantity: item.quantity,
            unit_price: item.unit_price ?? 0,
            requires_shipping: item.requires_shipping ?? true,
            metadata: item.metadata ?? undefined,
          })),
        })),
      })
    );

    const draftOrder = transform(
      { coreDraftOrder, customDraftOrder },
      ({ coreDraftOrder, customDraftOrder }) =>
        (coreDraftOrder ?? customDraftOrder) as { id: string }
    );

    const orderEditInput = transform({ draftOrder }, ({ draftOrder }) => {
      return {
        order_id: draftOrder.id,
        description: "",
        internal_note: "",
        metadata: {},
      };
    });

    const changeOrder = beginOrderEditOrderWorkflow.runAsStep({
      input: orderEditInput,
    });

    when(
      "rfq-cart-has-company",
      { cart },
      ({ cart }) => Boolean(cart.metadata?.company_id)
    ).then(() => {
      const links = transform({ draftOrder, cart }, ({ draftOrder, cart }) => {
        return [
          {
            [Modules.ORDER]: { order_id: draftOrder.id },
            [COMPANY_MODULE]: { company_id: cart.metadata.company_id },
          },
        ] as LinkDefinition[];
      });

      createRemoteLinkStep(links);
    });

    const quotes = createQuotesWorkflow.runAsStep({
      input: [
        {
          draft_order_id: draftOrder.id,
          cart_id: cart.id,
          customer_id: customer.id,
          order_change_id: changeOrder.id,
        },
      ],
    });

    return new WorkflowResponse(
      transform({ quotes }, ({ quotes }) => ({ quote: quotes[0] }))
    );
  }
);
