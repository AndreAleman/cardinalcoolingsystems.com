"use client"

import { CartPanelProvider } from "@lib/context/cart-panel-context"

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartPanelProvider>{children}</CartPanelProvider>
}
