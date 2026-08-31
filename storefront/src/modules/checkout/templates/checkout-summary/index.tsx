import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  // Only show shipping total if there's actually a shipping method selected
  const hasShippingMethod = cart?.shipping_methods && cart.shipping_methods.length > 0
  const actualShippingTotal = hasShippingMethod ? (cart?.shipping_total ?? 0) : 0

  // Create the totals object with corrected shipping logic
  const totals = {
    subtotal: cart?.subtotal ?? 0,
    item_subtotal: cart?.item_subtotal ?? 0,  // ✅ ADD THIS
    total: cart?.total,
    shipping_total: actualShippingTotal,
    tax_total: cart?.tax_total,
    discount_total: cart?.discount_total,
    gift_card_total: cart?.gift_card_total,
    currency_code: cart?.currency_code
  };

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0">
      <div className="w-full bg-white flex flex-col">
        <Divider />
        <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
          Summary
        </Heading>
        <DiscountCode cart={cart} />
        <Divider />
        
        <CartTotals totals={totals} />
        
        <ItemsPreviewTemplate items={cart?.items} />
      </div>
    </div>
  )
}

export default CheckoutSummary



