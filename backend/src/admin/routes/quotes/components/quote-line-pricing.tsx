import { Badge, Button, Input, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  computeSellPrice,
} from "../../../../workflows/quote/utils/markup"
import {
  useQuoteLinePricing,
  useSetQuoteLinePricing,
} from "../../../hooks/quotes"
import { formatAmount } from "../../../lib/format"

type DraftRow = { cost: string; markup_pct: string }

/*
  Internal markup calculator — per-line cost + markup% inputs computing
  the sell price locally (same arithmetic the backend uses). ADMIN
  ONLY: none of these numbers exist on any /store response. Saving
  upserts the rows; applying the computed sell to the draft order still
  happens through Medusa's draft-order editor (deep link on the page).
*/
export const QuoteLinePricing = ({
  quoteId,
  currencyCode,
}: {
  quoteId: string
  currencyCode?: string
}) => {
  const { data, isPending } = useQuoteLinePricing(quoteId)
  const save = useSetQuoteLinePricing(quoteId)
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({})

  const lines = data?.line_pricings ?? []

  /* Seed inputs from saved rows whenever the server data changes. */
  useEffect(() => {
    if (!data) return
    setDrafts(
      Object.fromEntries(
        data.line_pricings.map((line) => [
          line.item_id,
          {
            cost: line.cost !== null ? String(line.cost) : "",
            markup_pct: line.markup_pct !== null ? String(line.markup_pct) : "",
          },
        ])
      )
    )
  }, [data])

  const parse = (value: string): number | null => {
    if (value.trim() === "") return null
    const n = Number(value)
    return Number.isFinite(n) && n >= 0 ? n : null
  }

  const sellFor = (itemId: string): number | null => {
    const draft = drafts[itemId]
    if (!draft) return null
    const cost = parse(draft.cost)
    const markup = parse(draft.markup_pct)
    if (cost === null || markup === null) return null
    return computeSellPrice(cost, markup)
  }

  const pricedRows = lines
    .map((line) => {
      const draft = drafts[line.item_id]
      const cost = draft ? parse(draft.cost) : null
      const markup_pct = draft ? parse(draft.markup_pct) : null
      return cost !== null && markup_pct !== null
        ? { item_id: line.item_id, cost, markup_pct }
        : null
    })
    .filter((row): row is { item_id: string; cost: number; markup_pct: number } => !!row)

  const setDraft = (itemId: string, patch: Partial<DraftRow>) =>
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { cost: "", markup_pct: "", ...prev[itemId], ...patch },
    }))

  if (isPending) {
    return (
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">Loading pricing…</Text>
      </div>
    )
  }

  const totals = data?.totals

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Internal pricing
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Cost + markup compute the sell price. Apply prices via the draft order.
          </Text>
        </div>
        <Badge size="2xsmall" rounded="full" color="grey">
          Never shown to customer
        </Badge>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Item</Table.HeaderCell>
            <Table.HeaderCell>Qty</Table.HeaderCell>
            <Table.HeaderCell>Current sell</Table.HeaderCell>
            <Table.HeaderCell>Unit cost</Table.HeaderCell>
            <Table.HeaderCell>Markup %</Table.HeaderCell>
            <Table.HeaderCell>Computed sell</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {lines.map((line) => {
            const draft = drafts[line.item_id] ?? { cost: "", markup_pct: "" }
            const computed = sellFor(line.item_id)
            return (
              <Table.Row key={line.item_id}>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-base">{line.title}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="tabular-nums">{line.quantity}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="tabular-nums">
                    {formatAmount(line.sell_price, currencyCode)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Input
                    size="small"
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-28"
                    value={draft.cost}
                    placeholder="0.00"
                    onChange={(e) => setDraft(line.item_id, { cost: e.target.value })}
                  />
                </Table.Cell>
                <Table.Cell>
                  <Input
                    size="small"
                    type="number"
                    min={0}
                    step="0.1"
                    className="w-24"
                    value={draft.markup_pct}
                    placeholder="0"
                    onChange={(e) =>
                      setDraft(line.item_id, { markup_pct: e.target.value })
                    }
                  />
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" weight="plus" className="tabular-nums">
                    {computed !== null ? formatAmount(computed, currencyCode) : "—"}
                  </Text>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>

      <div className="px-6 py-4 flex items-center justify-between border-t border-ui-border-base">
        <div className="flex flex-col gap-0.5">
          {totals && (
            <>
              <Text size="small" className="text-ui-fg-subtle tabular-nums">
                Cost {formatAmount(totals.total_cost, currencyCode)} · Sell{" "}
                {formatAmount(totals.total_sell, currencyCode)} · Margin{" "}
                {formatAmount(totals.margin, currencyCode)}
                {totals.margin_pct !== null ? ` (${totals.margin_pct.toFixed(2)}%)` : ""}
              </Text>
              {totals.unpriced_lines > 0 && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {totals.unpriced_lines}{" "}
                  {totals.unpriced_lines === 1 ? "line" : "lines"} without cost
                  data — cost and margin are understated.
                </Text>
              )}
            </>
          )}
        </div>
        <Button
          size="small"
          variant="secondary"
          isLoading={save.isPending}
          disabled={save.isPending || pricedRows.length === 0}
          onClick={() => save.mutate(pricedRows)}
        >
          Save pricing
        </Button>
      </div>
    </div>
  )
}
