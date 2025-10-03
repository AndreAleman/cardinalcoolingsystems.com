import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  // Debug both the cart object and individual fields
  console.log("🔍 Cart data passed to CartTotals:", {
    subtotal: cart?.subtotal,
    item_total: cart?.item_total,
    total: cart?.total,
    shipping_total: cart?.shipping_total,
    tax_total: cart?.tax_total
  });

  // FIXED: Explicitly create the totals object with fallback logic
  const totals = {
    subtotal: cart?.subtotal ?? cart?.item_subtotal ?? 0,  // ← FIXED: Use item_subtotal as fallback
    total: cart?.total,
    shipping_total: cart?.shipping_total,
    tax_total: cart?.tax_total,
    discount_total: cart?.discount_total,
    gift_card_total: cart?.gift_card_total,
    currency_code: cart?.currency_code
  };

  console.log("🔍 Totals object being passed to CartTotals111:", totals);

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0">
      <div className="w-full bg-white flex flex-col">
        <Divider />
        <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
          Summary
        </Heading>
        <DiscountCode cart={cart} />
        <Divider />
        
        {/* Pass the properly structured totals object */}
        <CartTotals totals={totals} />
        
        {/* FIXED: Removed the problematic region prop */}
        <ItemsPreviewTemplate items={cart?.items} />
      </div>
    </div>
  )
}

export default CheckoutSummary
