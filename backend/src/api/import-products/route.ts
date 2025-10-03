import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // --- Define Sizes and Alloys ---
  const sizes = [
    { label: "1in", code: "100", price: 200 },
    { label: "2in", code: "200", price: 300 },
    { label: "3in", code: "300", price: 400 },
  ]

  const alloys = [
    { label: "t304", modifier: 0 },
    { label: "t316", modifier: 20 },
  ]

  // --- Build Variants Dynamically ---
  const variants = []

  for (const size of sizes) {
    for (const alloy of alloys) {
      variants.push({
        title: `Test Nut ${size.label} - ${alloy.label}`,
        sku: `14v-${size.code}-${alloy.label}`,
        // Use array of option values, not object
        options: {

          Size: size.label,

          Alloy: alloy.label,

        },
        prices: [
          {
            amount: size.price + alloy.modifier, // in smallest currency unit (e.g., 200 = $2.00)
            currency_code: "usd",
          }
        ],
        manage_inventory: true
      })
    }
  }

  // --- Create Product via Medusa Workflow ---
  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          title: "Union Hex Nut",
          options: [
            {
              title: "Size",
              values: sizes.map((s) => s.label),
            },
            {
              title: "Alloy",
              values: alloys.map((a) => a.label),
            },
          ],
          variants,
        }
      ],
    }
  })

  // --- Send Back Result ---
  res.json(result)
}
