import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const setupFreeShippingPromotion = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const promotionModuleService = req.scope.resolve(Modules.PROMOTION)
  
  try {
    // Check if promotion already exists
    const existing = await promotionModuleService.listPromotions({
      code: ["FREESHIP100"],
    })

    if (existing.length > 0) {
      return res.json({ 
        message: "Free shipping promotion already exists",
        promotion: existing[0] 
      })
    }

    // Create automatic free shipping promotion for orders >= $100
    const [promotion] = await promotionModuleService.createPromotions([
      {
        code: "FREESHIP100",
        type: "standard",
        status: "active",
        is_automatic: true,
        application_method: {
          type: "percentage",
          target_type: "shipping_methods",
          allocation: "across",
          value: 100,
        },
        rules: [
          {
            attribute: "subtotal",
            operator: "gte",
            values: ["10000"],
          },
        ],
      },
    ])

    return res.json({ 
      message: "Free shipping promotion created successfully!",
      promotion,
      note: "Shipping will be FREE automatically when cart subtotal >= $100"
    })
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    })
  }
}

export const POST = setupFreeShippingPromotion
export const GET = setupFreeShippingPromotion
export const AUTHENTICATE = false
