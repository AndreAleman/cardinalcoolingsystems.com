import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";

/*
  Build a cart for Quote-Only Lines through the cart MODULE, not the
  core createCartWorkflow — the core flow validates prices and
  inventory, which is exactly what quote-only lines fail (no price on
  file, or quantity over stock). A quote cart never completes; it only
  feeds the request-quote pipeline, where Cardinal prices the lines
  through the order edit. Unpriced lines carry unit_price 0 until then.
*/

type Input = {
  region_id: string;
  customer_id: string;
  items: { variant_id: string; quantity: number }[];
};

type Output = {
  cart_id: string;
};

export const buildQuoteCartStep = createStep(
  "build-quote-cart",
  async ({ region_id, customer_id, items }: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const cartModule = container.resolve(Modules.CART);
    const regionModule = container.resolve(Modules.REGION);
    const storeModule = container.resolve(Modules.STORE);
    const customerModule = container.resolve(Modules.CUSTOMER);

    const region = await regionModule.retrieveRegion(region_id);
    const customer = await customerModule.retrieveCustomer(customer_id);
    const [store] = await storeModule.listStores();

    const variantIds = items.map((item) => item.variant_id);
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: [
        "id",
        "sku",
        "title",
        "product.id",
        "product.title",
        "product.thumbnail",
        "prices.amount",
        "prices.currency_code",
      ],
      filters: { id: variantIds },
    });
    const variantById = new Map(
      (variants as any[]).map((variant) => [variant.id, variant])
    );

    const missing = variantIds.filter((id) => !variantById.has(id));
    if (missing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown variants: ${missing.join(", ")}`
      );
    }

    const cart = await cartModule.createCarts({
      region_id,
      currency_code: region.currency_code,
      customer_id,
      email: customer.email,
      sales_channel_id: store?.default_sales_channel_id ?? undefined,
      items: items.map((item) => {
        const variant = variantById.get(item.variant_id);
        const price = ((variant.prices ?? []) as any[]).find(
          (p) => p.currency_code === region.currency_code
        );
        // Every quote-cart line is custom: a variant_id would drag the
        // core order workflow's price validation and inventory
        // reservation into draft-order creation — the exact checks
        // quote-only lines fail (no price / over stock). The real
        // variant id rides in metadata for admin traceability.
        return {
          quantity: item.quantity,
          unit_price: Number(price?.amount ?? 0),
          title: variant.title ?? variant.product?.title ?? "Part",
          subtitle: variant.product?.title ?? undefined,
          thumbnail: variant.product?.thumbnail ?? undefined,
          variant_sku: variant.sku ?? undefined,
          requires_shipping: true,
          metadata: { quote_variant_id: variant.id },
        };
      }),
    });

    return new StepResponse<Output, string>({ cart_id: cart.id }, cart.id);
  },
  async (cartId, { container }) => {
    if (!cartId) return;
    const cartModule = container.resolve(Modules.CART);
    await cartModule.deleteCarts(cartId);
  }
);
