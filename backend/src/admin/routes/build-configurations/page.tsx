import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useState } from "react"
import {
  BuilderTypeKey,
  BuildConfigurationFilters,
  useBuildConfigurations,
} from "../../hooks/build-configurations"
import { formatAmount, formatDate } from "../../lib/format"

/*
  Builder → Configurations (Cardinal Builder plan B5): every Configuration
  buyers priced on the Builders, most-resolved first. Quote rows with a
  high count are the "what to stock next" signal: the parts that keep a
  popular kit out of Instant.
*/

const BUILDERS: { key?: BuilderTypeKey; label: string }[] = [
  { label: "All builders" },
  { key: "cdu-kit", label: "CDU Hookup Kit" },
  { key: "row-manifold", label: "Row Manifold" },
  { key: "transition", label: "Transition Spool" },
  { key: "strainer", label: "Strainer" },
  { key: "hose", label: "Hose" },
]
const MODES: { key?: "instant" | "quote"; label: string }[] = [
  { label: "Any mode" },
  { key: "quote", label: "Quote" },
  { key: "instant", label: "Instant" },
]
const BUILDER_LABEL = Object.fromEntries(
  BUILDERS.filter((b) => b.key).map((b) => [b.key, b.label])
) as Record<BuilderTypeKey, string>

const BuildConfigurationsPage = () => {
  const [filters, setFilters] = useState<BuildConfigurationFilters>({ sort: "resolve_count" })
  const { data, isPending } = useBuildConfigurations(filters)
  const rows = data?.build_configurations ?? []

  return (
    <Container className="flex flex-col p-0 overflow-hidden">
      <div className="px-6 py-4 flex flex-col gap-3 border-b border-ui-border-base">
        <div>
          <Heading className="font-sans font-medium h1-core">Builder configurations</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            What buyers priced on the Builders. Popular Quote configurations show what to stock next.
          </Text>
        </div>
        <div className="flex flex-wrap gap-1">
          {BUILDERS.map((b) => (
            <Button
              key={b.label}
              size="small"
              variant={filters.builder_type === b.key ? "secondary" : "transparent"}
              onClick={() => setFilters((f) => ({ ...f, builder_type: b.key }))}
            >
              {b.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          {MODES.map((m) => (
            <Button
              key={m.label}
              size="small"
              variant={filters.pricing_mode === m.key ? "secondary" : "transparent"}
              onClick={() => setFilters((f) => ({ ...f, pricing_mode: m.key }))}
            >
              {m.label}
            </Button>
          ))}
          <span className="mx-2 text-ui-fg-muted">·</span>
          <Button
            size="small"
            variant={filters.sort === "resolve_count" ? "secondary" : "transparent"}
            onClick={() => setFilters((f) => ({ ...f, sort: "resolve_count" }))}
          >
            Most priced
          </Button>
          <Button
            size="small"
            variant={filters.sort === "recent" ? "secondary" : "transparent"}
            onClick={() => setFilters((f) => ({ ...f, sort: "recent" }))}
          >
            Most recent
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Swatch className="text-ui-fg-muted" />
          <Text className="text-ui-fg-muted text-sm">No configurations yet</Text>
          <Text className="text-ui-fg-subtle text-xs">
            Every configuration a buyer prices on a Builder appears here.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Part number</Table.HeaderCell>
              <Table.HeaderCell>Builder</Table.HeaderCell>
              <Table.HeaderCell>Mode</Table.HeaderCell>
              <Table.HeaderCell>Instant price</Table.HeaderCell>
              <Table.HeaderCell>Times priced</Table.HeaderCell>
              <Table.HeaderCell>First by</Table.HeaderCell>
              <Table.HeaderCell>Last priced</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell>
                  <Text size="small" weight="plus" className="font-mono text-ui-fg-base">
                    {row.part_number}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-muted break-all">
                    {row.config_key.split("?")[1] ?? ""}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{BUILDER_LABEL[row.builder_type] ?? row.builder_type}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={row.pricing_mode === "instant" ? "green" : "orange"}>
                    {row.pricing_mode === "instant" ? "Instant" : "Quote"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="tabular-nums">
                    {row.instant_price !== null ? formatAmount(row.instant_price, "usd") : "—"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="tabular-nums">{row.resolve_count}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {row.created_by_domain ?? "anonymous"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-muted">
                    {formatDate(row.last_resolved_at)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Builder configurations",
  icon: Swatch,
})

export default BuildConfigurationsPage
