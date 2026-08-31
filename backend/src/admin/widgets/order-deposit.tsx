import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

/*
  Deposit panel on the order page — only for orders promoted through
  the 50%-deposit rule (metadata.payment_rule === "deposit_50").
  The invoices themselves are sent manually from Stripe; this widget
  just tracks where the order is in that flow.
*/

type DepositStatus = "due" | "deposit_invoiced" | "balance_invoiced" | "paid"

const STATUS_LABELS: Record<DepositStatus, string> = {
  due: "Deposit due",
  deposit_invoiced: "Deposit invoiced",
  balance_invoiced: "Balance invoiced",
  paid: "Paid in full",
}

const STATUS_COLORS: Record<DepositStatus, "red" | "orange" | "blue" | "green"> = {
  due: "red",
  deposit_invoiced: "orange",
  balance_invoiced: "blue",
  paid: "green",
}

const STATUS_HINTS: Record<DepositStatus, string> = {
  due: "Send the 50% deposit invoice from Stripe, then mark it here.",
  deposit_invoiced:
    "Deposit invoice sent. After the goods arrive, send the balance invoice from Stripe (net 30) and mark it here.",
  balance_invoiced:
    "Balance invoice sent. Once the customer has paid both invoices, mark the order paid.",
  paid: "Both invoices are settled — nothing left to do.",
}

const depositKey = (orderId: string) => ["order-deposit", orderId] as const

const OrderDepositWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const queryClient = useQueryClient()

  /* The widget's `data` snapshot can go stale after our own updates —
     fetch metadata ourselves so the panel always shows the live state. */
  const { data: orderData } = useQuery({
    queryKey: depositKey(data.id),
    queryFn: () =>
      sdk.client.fetch<{ order: { id: string; metadata?: Record<string, unknown> | null } }>(
        `/admin/orders/${data.id}`,
        { query: { fields: "id,metadata" } }
      ),
  })

  const setStatus = useMutation({
    mutationFn: (status: Exclude<DepositStatus, "due">) =>
      sdk.client.fetch<{ order: { id: string; metadata?: Record<string, unknown> | null } }>(
        `/admin/orders/${data.id}/deposit-status`,
        { method: "POST", body: { status } }
      ),
    onSuccess: (_res, status) => {
      queryClient.invalidateQueries({ queryKey: depositKey(data.id) })
      toast.success(`Order marked "${STATUS_LABELS[status]}"`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const metadata = (orderData?.order?.metadata ??
    data.metadata ??
    {}) as Record<string, unknown>

  if (metadata.payment_rule !== "deposit_50") {
    return null
  }

  const status = (metadata.deposit_status as DepositStatus) || "due"

  return (
    <Container className="flex flex-col p-0 overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-ui-border-base">
        <Heading className="font-sans font-medium text-sm">
          50% deposit order
        </Heading>
        <StatusBadge color={STATUS_COLORS[status] ?? "red"}>
          {STATUS_LABELS[status] ?? String(status)}
        </StatusBadge>
      </div>

      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <Text size="small" className="text-ui-fg-subtle">
          {STATUS_HINTS[status] ?? STATUS_HINTS.due}
        </Text>

        <div className="flex shrink-0 gap-2">
          {status === "due" && (
            <Button
              size="small"
              variant="secondary"
              isLoading={setStatus.isPending}
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("deposit_invoiced")}
            >
              Mark deposit invoiced
            </Button>
          )}
          {status === "deposit_invoiced" && (
            <Button
              size="small"
              variant="secondary"
              isLoading={setStatus.isPending}
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("balance_invoiced")}
            >
              Mark balance invoiced
            </Button>
          )}
          {(status === "deposit_invoiced" || status === "balance_invoiced") && (
            <Button
              size="small"
              isLoading={setStatus.isPending}
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("paid")}
            >
              Mark paid
            </Button>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderDepositWidget
