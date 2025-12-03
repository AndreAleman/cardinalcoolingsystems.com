import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateProductFeedWorkflow } from "../../workflows/generate-product-feed"

export async function GET(
  req: MedusaRequest, 
  res: MedusaResponse
) {
  const { 
    currency_code,
    country_code,
  } = req.validatedQuery

  const { result } = await generateProductFeedWorkflow(req.scope).run({
    input: {
      currency_code: currency_code as string,
      country_code: country_code as string,
    },
  })

  res.writeHead(200, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Content-Length': Buffer.byteLength(result.xml, 'utf-8')
  })
  res.end(result.xml, 'utf-8')
}
