import { LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/solid"
import { Text } from "@medusajs/ui"

export default function PaymentTrustBadges() {
  return (
    <div className="mt-6 pt-6 border-t border-ui-border-base space-y-4">
      {/* Payment Methods Accepted */}
      <div className="flex items-center justify-between">
        <Text className="text-sm text-ui-fg-subtle">We accept:</Text>
        <div className="flex gap-2">
          <div className="h-8 w-12 bg-ui-bg-base rounded border border-ui-border-base flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-600">VISA</span>
          </div>
          <div className="h-8 w-12 bg-ui-bg-base rounded border border-ui-border-base flex items-center justify-center">
            <span className="text-xs font-semibold text-red-600">MC</span>
          </div>
          <div className="h-8 w-12 bg-ui-bg-base rounded border border-ui-border-base flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-500">AMEX</span>
          </div>
          <div className="h-8 w-12 bg-ui-bg-base rounded border border-ui-border-base flex items-center justify-center">
            <span className="text-xs font-semibold text-orange-600">DISC</span>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-ui-fg-subtle">
          <LockClosedIcon className="w-4 h-4 text-green-600" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center gap-2 text-ui-fg-subtle">
          <ShieldCheckIcon className="w-4 h-4 text-green-600" />
          <span>256-bit Encryption</span>
        </div>
      </div>

      {/* Powered by Stripe */}
      <div className="flex items-center justify-center">
        <div className="text-xs text-ui-fg-muted flex items-center gap-2">
          <span>Secure payment processing by</span>
          <span className="font-semibold text-indigo-600">Stripe</span>
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  )
}
