import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const deleteShipstationPrice = async (req: MedusaRequest, res: MedusaResponse) => {
  const pricingModuleService = req.scope.resolve(Modules.PRICING)

  try {
    // The bad $1000 price id
    const PRICE_ID = "price_01KCQ51DKHWR0DAWWKQT2YBJ8P"

    await pricingModuleService.removePrices([PRICE_ID])

    return res.json({
      deleted: PRICE_ID,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message, stack: e.stack })
  }
}

export const POST = deleteShipstationPrice
export const AUTHENTICATE = false
