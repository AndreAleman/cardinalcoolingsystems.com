import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const debugPromotions = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const promotionModuleService = req.scope.resolve(Modules.PROMOTION)
  
  try {
    const allPromotions = await promotionModuleService.listPromotions()
    
    return res.json({ 
      count: allPromotions.length,
      promotions: allPromotions,
      cartId: "cart_01KCPTEHAYWMA27VH712PJ7X1E",
      note: "Check if FREESHIP100 exists and is active"
    })
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    })
  }
}

export const GET = debugPromotions

export const AUTHENTICATE = false  // ← ADD THIS LINE