import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { getProductFeedItemsStep } from "./steps/get-product-feed-items"
import { buildProductFeedXmlStep } from "./steps/build-product-feed-xml"

type GenerateProductFeedWorkflowInput = {
  currency_code: string
  country_code: string
}

type GenerateProductFeedWorkflowOutput = {
  xml: string
}

export const generateProductFeedWorkflow = createWorkflow<
  GenerateProductFeedWorkflowInput,
  GenerateProductFeedWorkflowOutput,
  any
>(
  "generate-product-feed",
  (input) => {
    const { items: feedItems } = getProductFeedItemsStep(input)

    const xml = buildProductFeedXmlStep({
      items: feedItems,
    })

    return new WorkflowResponse({ xml })
  }
)

export default generateProductFeedWorkflow
