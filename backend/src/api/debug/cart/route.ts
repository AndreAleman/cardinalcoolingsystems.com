import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const cartId = req.query.cart_id as string

  if (!cartId) {
    return res.status(400).json({ error: "cart_id query param required" })
  }

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "currency_code",
      "subtotal",
      "item_total",
      "item_subtotal",
      "item_tax_total",
      "shipping_total",
      "shipping_subtotal",
      "shipping_tax_total",
      "original_total",
      "original_subtotal",
      "original_item_total",
      "original_item_subtotal",
      "discount_total",
      "discount_tax_total",
      "gift_card_total",
      "gift_card_tax_total",
      "items.*",
      "items.adjustments.*",
      "shipping_methods.*",
      "shipping_methods.adjustments.*",
    ],
    filters: { id: cartId },
  })

  const cart = carts[0]

  const sum_of_item_subtotals =
    cart?.items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0

  const cart_subtotal = cart?.subtotal || 0

  const difference = cart_subtotal - sum_of_item_subtotals

  const all_adjustments = [
    ...(cart?.items?.flatMap((i) => i.adjustments || []) || []),
    ...(cart?.shipping_methods?.flatMap((s) => s.adjustments || []) || []),
  ]

  return res.json({
    cart,
    analysis: {
      sum_of_item_subtotals,
      cart_subtotal,
      difference,
      all_adjustments,
    },
  })
}
