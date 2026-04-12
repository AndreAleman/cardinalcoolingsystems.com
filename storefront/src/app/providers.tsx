"use client"

import { QuoteProvider } from "@lib/context/quote-context"
import { CartPanelProvider } from "@lib/context/cart-panel-context"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartPanelProvider>
      <QuoteProvider>{children}</QuoteProvider>
    </CartPanelProvider>
  )
}
