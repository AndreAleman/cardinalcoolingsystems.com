import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const recalculateShipping = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const cartModuleService = req.scope.resolve(Modules.CART)
  
  try {
    const cartId = "cart_01KCPTEHAYWMA27VH712PJ7X1E"
    
    // Get the cart
    const cart = await cartModuleService.retrieveCart(cartId, {
      relations: ["shipping_methods"]
    })

    if (!cart.shipping_methods?.length) {
      return res.json({ error: "No shipping methods to recalculate" })
    }

    const shippingMethodId = cart.shipping_methods[0].id

    // Delete the shipping method
    await cartModuleService.deleteShippingMethods([shippingMethodId])

    // Add it back - this will trigger calculatePrice()
    await cartModuleService.addShippingMethods(cartId, [{
      name: "UPS Ground",
      shipping_option_id: "so_01K9V4CGE9E80N64X8EZ8VMVBW",
      amount: 0 // This will be recalculated by ShipStation
    }])

    const updatedCart = await cartModuleService.retrieveCart(cartId, {
      relations: ["shipping_methods"]
    })

    return res.json({ 
      message: "Shipping recalculated",
      new_shipping_amount: updatedCart.shipping_methods?.[0]?.amount,
      shipping_total: updatedCart.shipping_total,
      note: "Check backend console for ShipStation logs"
    })
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    })
  }
}

export const POST = recalculateShipping
export const AUTHENTICATE = false
