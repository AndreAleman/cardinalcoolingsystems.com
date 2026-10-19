import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { addToCartWorkflow, createCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { BuilderType } from "../../../../lib/cpq-shared"
import { loadStoreContext } from "../lib/catalog"
import { resolveBuyer } from "../lib/price-basis"
import { instantLineMetadata, planInstantLines, quoteLineItem, withUnits } from "../lib/quote-line"
import { recordConfiguration, resolveBuild } from "../lib/resolve-build"
import type { StoreBuildQuoteLinesType } from "../validators"

/*
  POST /store/build/quote-lines (plan "Backend contracts", B3)

  Body { cart_id?, builder_type, options, units?, source_page? }. Adds a
  Configuration to the Quote List (= the Medusa cart). Everything comes
  from a fresh server-side resolve; client prices, part numbers and
  display rows are never trusted.

  - Instant: the BOM's variants as real line items (Medusa prices them in
    the cart's own context). A line that would exceed stock once the
    cart's quantity is counted goes in as a quote-only line (ADR-0001).
  - Quote: one custom line at unit_price 0 with the B3 metadata. The
    checkout guard (validate-cart-completion) refuses such a cart.

  With no cart_id a cart is created in the US region.
*/
export const POST = async (req: AuthenticatedMedusaRequest<StoreBuildQuoteLinesType>, res: MedusaResponse) => {
  const body = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const buyer = await resolveBuyer(req.scope, req.auth_context?.actor_id)
  const sourcePage = body.source_page ?? null

  const applied = withUnits(body.builder_type, body.options, body.units)
  const r = await resolveBuild(req.scope, {
    builder_type: body.builder_type as BuilderType,
    options: applied.options,
    buyer,
    extraIgnored: applied.unitsIgnored ? ["units"] : [],
  })
  void recordConfiguration(req.scope, r, buyer)

  let cartId = body.cart_id
  const cartQtyByVariant = new Map<string, number>()
  if (cartId) {
    const {
      data: [cart],
    } = await query.graph({
      entity: "cart",
      fields: ["id", "completed_at", "items.variant_id", "items.quantity"],
      filters: { id: cartId },
    })
    if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`)
    if ((cart as any).completed_at) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart has already been completed.")
    }
    for (const it of ((cart as any).items ?? []) as any[]) {
      if (!it?.variant_id) continue
      cartQtyByVariant.set(it.variant_id, (cartQtyByVariant.get(it.variant_id) ?? 0) + Number(it.quantity ?? 0))
    }
  } else {
    const store = await loadStoreContext(req.scope)
    const { result } = await createCartWorkflow(req.scope).run({
      input: {
        region_id: store.region_id,
        ...(store.sales_channel_id ? { sales_channel_id: store.sales_channel_id } : {}),
        ...(buyer.customer_id ? { customer_id: buyer.customer_id } : {}),
      },
    })
    cartId = result.id
  }

  const added: Record<string, unknown>[] = []
  const items: Record<string, unknown>[] = []

  if (r.pricing_mode === "instant") {
    const meta = instantLineMetadata(r, r.configuration_id, sourcePage)
    for (const line of planInstantLines(r.bom, cartQtyByVariant)) {
      if (line.over_stock) {
        // Same shape build-quote-cart uses for over-stock lines: custom, $0, real variant in metadata.
        items.push({
          title: line.title,
          variant_sku: line.sku,
          quantity: line.quantity,
          unit_price: 0,
          requires_shipping: true,
          metadata: { ...meta, quote_variant_id: line.variant_id, over_stock: true },
        })
      } else {
        items.push({ variant_id: line.variant_id, quantity: line.quantity, metadata: meta })
      }
      added.push({
        kind: line.over_stock ? "quote_only" : "variant",
        sku: line.sku,
        variant_id: line.variant_id,
        quantity: line.quantity,
      })
    }
  } else {
    const item = quoteLineItem(r, r.configuration_id, sourcePage)
    items.push(item)
    added.push({
      kind: "quote",
      part_number: r.part_number,
      title: item.title,
      quantity: item.quantity,
      configuration_id: r.configuration_id,
    })
  }

  if (items.length) {
    await addToCartWorkflow(req.scope).run({ input: { cart_id: cartId as string, items: items as any } })
  }

  res.json({
    cart_id: cartId,
    pricing_mode: r.pricing_mode,
    part_number: r.part_number,
    configuration_id: r.configuration_id,
    ignored: r.ignored,
    added,
  })
}
