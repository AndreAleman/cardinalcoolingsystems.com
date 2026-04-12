import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/types"
import { Container, Heading, Switch, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../lib/sdk"

const RequiresQuoteWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const current = !!(
    data.metadata?.requires_quote === true ||
    data.metadata?.requires_quote === "true"
  )

  const [enabled, setEnabled] = useState(current)
  const [saving, setSaving] = useState(false)

  const toggle = async (next: boolean) => {
    setSaving(true)
    try {
      await sdk.admin.product.update(data.id, {
        metadata: { ...data.metadata, requires_quote: next },
      } as Parameters<typeof sdk.admin.product.update>[1])
      setEnabled(next)
      toast.success(
        next
          ? "Product set to quote-only"
          : "Product restored to normal pricing"
      )
    } catch (err) {
      toast.error("Failed to update — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="flex items-start justify-between gap-4 p-6">
      <div>
        <Heading className="font-sans font-medium text-sm">
          Quote-only product
        </Heading>
        <Text className="text-ui-fg-subtle text-sm mt-0.5">
          {enabled
            ? "Add to Cart is hidden — customers must request a quote."
            : "Customers can add this product to their cart normally."}
        </Text>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        disabled={saving}
      />
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default RequiresQuoteWidget
