import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const debugCartShipping = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const cartModuleService = req.scope.resolve(Modules.CART)
  
  try {
    const cart = await cartModuleService.retrieveCart("cart_01KCPTEHAYWMA27VH712PJ7X1E", {
      relations: ["items", "shipping_methods"]
    })

    return res.json({ 
      cart_id: cart.id,
      items: cart.items?.map(i => ({
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal
      })),
      shipping_methods: cart.shipping_methods?.map(sm => ({
        id: sm.id,
        name: sm.name,
        amount: sm.amount,
        shipping_option_id: sm.shipping_option_id
      })),
      subtotal: cart.subtotal,
      shipping_total: cart.shipping_total,
      total: cart.total
    })
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message
    })
  }
}

export const GET = debugCartShipping
export const AUTHENTICATE = false
