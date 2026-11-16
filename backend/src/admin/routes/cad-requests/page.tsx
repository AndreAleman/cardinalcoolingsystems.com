import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CubeSolid } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Switch, Table, Tabs, Text, Toaster, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useCadRequests, useCadSettings, useUpdateCadSettings } from "../../hooks/cad-requests"
import { CAD_TABS, type CadTab, cadRef, cadStatusBadge, requesterLabel } from "./shared"

/*
  CAD Requests (Cardinal Builder plan B7, Sanitube's CAD Review): every CAD Package waits for staff
  approval while "Require review" is on (the default). The list opens on "Awaiting review".
*/

const CAP_MAX = 1000
const PAGE_SIZE = 25

const SettingsHeader = () => {
  const { data, isPending, isError } = useCadSettings()
  const [cap, setCap] = useState("")
  const prompt = usePrompt()
  const update = useUpdateCadSettings()

  useEffect(() => {
    if (data) setCap(String(data.daily_generation_cap))
  }, [data?.daily_generation_cap])

  const trimmed = cap.trim()
  const parsed = Number(trimmed)
  const valid = /^\d+$/.test(trimmed) && parsed >= 0 && parsed <= CAP_MAX
  const dirty = !!data && valid && parsed !== data.daily_generation_cap

  const saveCap = async () => {
    if (!valid) return
    if (parsed === 0) {
      const ok = await prompt({
        title: "Set the daily cap to 0?",
        description:
          "Every visitor request for a new Part Number will be Queued until staff generate it. Already-generated CAD Packages and signed-in customers are not affected.",
        confirmText: "Set to 0",
        cancelText: "Cancel",
      })
      if (!ok) return
    }
    update.mutate(
      { daily_generation_cap: parsed },
      {
        onSuccess: (d) => toast.success(`Daily cap set to ${d.daily_generation_cap}`),
        onError: (e: any) => toast.error("Could not save the cap", { description: e?.message || "Unknown error" }),
      }
    )
  }

  const toggleReview = async (on: boolean) => {
    if (!on) {
      const ok = await prompt({
        title: "Turn off CAD review?",
        description:
          "New CAD Requests will no longer wait for staff approval: visitors get the download link by email right away, and signed-in customers download instantly. Requests already awaiting review stay there until you approve or reject them.",
        confirmText: "Turn off review",
        cancelText: "Cancel",
      })
      if (!ok) return
    }
    update.mutate(
      { require_review: on },
      {
        onSuccess: (d) =>
          toast.success(d.require_review ? "Review turned on" : "Review turned off", {
            description: d.require_review
              ? "Staff approve every CAD Package before the link is sent."
              : "Links are sent without review.",
          }),
        onError: (e: any) => toast.error("Could not change review", { description: e?.message || "Unknown error" }),
      }
    )
  }

  const svc = data?.service

  return (
    <Container className="p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <Heading className="font-sans font-medium h1-core">CAD Requests</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Requests for a Builder&apos;s CAD Package (STEP + PDF for transitions and manifolds, PDF for kits, strainers and hoses).{" "}
            {data?.require_review
              ? "Staff review every package; the link is emailed once approved."
              : "Visitors get the link by email."}
          </Text>
        </div>
        {svc && (
          <div className="flex items-center gap-2">
            <Badge size="small" color={!svc.enabled ? "grey" : svc.healthy ? "green" : "red"}>
              CAD service: {!svc.enabled ? "not configured" : svc.healthy ? "healthy" : "unreachable"}
            </Badge>
            {svc.healthy && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                generator v{svc.generator_version} · tables {svc.tables_hash}
              </Text>
            )}
          </div>
        )}
      </div>

      {isError && <Text className="text-ui-fg-error">Failed to load the CAD settings.</Text>}
      {isPending && <Text className="text-ui-fg-subtle">Loading…</Text>}

      {data && (
        <div className="rounded-md border border-ui-border-base p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Switch
              id="cad-require-review"
              checked={data.require_review}
              disabled={update.isPending}
              onCheckedChange={(on) => toggleReview(on)}
            />
            <div>
              <Label htmlFor="cad-require-review" className="text-sm font-medium">
                Require review
              </Label>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {data.require_review
                  ? "On: every CAD Package (visitors and signed-in customers) waits for staff approval."
                  : "Off: visitors get the link by email right away; signed-in customers download instantly."}
              </Text>
            </div>
          </div>
          {data.require_review && (
            <Badge size="small" color={data.today.review > 0 ? "orange" : "grey"}>
              Awaiting review: {data.today.review}
            </Badge>
          )}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md border border-ui-border-base p-4">
            <Text size="small" className="text-ui-fg-subtle">
              New generations today ({data.today.cap_day})
            </Text>
            <Text className="text-2xl font-medium">
              {data.today.generated} / {data.daily_generation_cap}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              Only never-generated Part Numbers count. Customers and released requests don&apos;t.
            </Text>
          </div>
          <div className="rounded-md border border-ui-border-base p-4">
            <Text size="small" className="text-ui-fg-subtle">
              Queued
            </Text>
            <Text className="text-2xl font-medium">{data.today.queued}</Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {data.require_review
                ? "Generated automatically at 9:00 Eastern the next business day, then wait for review. Or generate them now."
                : "Sent automatically at 9:00 Eastern the next business day, or release them now."}
            </Text>
          </div>
          <div className="rounded-md border border-ui-border-base p-4 flex flex-col gap-2">
            <Label htmlFor="cad-cap" className="text-sm text-ui-fg-subtle">
              Site-wide daily cap (0–{CAP_MAX})
            </Label>
            <div className="flex gap-2">
              <Input
                id="cad-cap"
                type="number"
                min={0}
                max={CAP_MAX}
                step={1}
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                aria-invalid={!valid}
                className="w-28"
              />
              <Button size="small" variant="secondary" disabled={!dirty || update.isPending} onClick={saveCap}>
                Save
              </Button>
            </div>
            {!valid && <Text size="xsmall" className="text-ui-fg-error">Enter a whole number from 0 to {CAP_MAX}.</Text>}
          </div>
        </div>
      )}
    </Container>
  )
}

const CadRequestsPage = () => {
  const [tab, setTab] = useState<CadTab>("all")
  // "Awaiting review" is the default tab while review is on (applied once, when the settings first
  // load; the user's choice wins after).
  const { data: settings } = useCadSettings()
  const tabChosen = useRef(false)
  useEffect(() => {
    if (!tabChosen.current && settings) {
      tabChosen.current = true
      if (settings.require_review) setTab("review")
    }
  }, [settings])
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState("")

  const tabQuery = CAD_TABS.find((t) => t.value === tab)?.query ?? {}
  const { data, isPending, isError } = useCadRequests({ limit: PAGE_SIZE, offset, ...tabQuery, q: q.trim() || undefined })
  const count = data?.count ?? 0

  return (
    <div className="flex flex-col gap-y-3">
      <SettingsHeader />

      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="p-6 flex justify-between items-center gap-4 flex-wrap">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              tabChosen.current = true
              setTab(v as CadTab)
              setOffset(0)
            }}
          >
            <Tabs.List>
              {CAD_TABS.map((t) => (
                <Tabs.Trigger key={t.value} value={t.value}>
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs>
          <Input
            type="search"
            placeholder="Search email / company / contact / Part Number"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOffset(0)
            }}
            className="w-80"
          />
        </div>

        {isError && (
          <div className="px-6 pb-4">
            <Text className="text-ui-fg-error">Failed to load CAD Requests.</Text>
          </div>
        )}

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Requester</Table.HeaderCell>
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Builder</Table.HeaderCell>
              <Table.HeaderCell>Part Number</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.cad_requests.map((r) => (
              <Table.Row key={r.id} className="cursor-pointer" onClick={() => (window.location.href = `/app/cad-requests/${r.id}`)}>
                <Table.Cell className="font-medium">{cadRef(r.display_id)}</Table.Cell>
                <Table.Cell>{new Date(r.created_at).toLocaleString()}</Table.Cell>
                <Table.Cell>{requesterLabel(r)}</Table.Cell>
                <Table.Cell>{r.company_name || r.customer?.company_name || "—"}</Table.Cell>
                <Table.Cell>{r.email || "—"}</Table.Cell>
                <Table.Cell>{r.builder_title}</Table.Cell>
                <Table.Cell className="font-mono text-xs">{r.part_number}</Table.Cell>
                <Table.Cell>
                  <Badge size="small" color={cadStatusBadge(r).color} className="whitespace-nowrap">
                    {cadStatusBadge(r).label}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {isPending && <Text className="px-6 py-4">Loading…</Text>}
        {!isPending && data?.cad_requests.length === 0 && (
          <Text className="px-6 py-4 text-ui-fg-muted">No CAD Requests matching this filter.</Text>
        )}

        <div className="px-6 py-4 flex items-center justify-between border-t border-ui-border-base">
          <Text size="small" className="text-ui-fg-subtle">
            {count === 0 ? "0 results" : `${offset + 1}–${Math.min(offset + PAGE_SIZE, count)} of ${count}`}
          </Text>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </Button>
            <Button size="small" variant="secondary" disabled={offset + PAGE_SIZE >= count} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </Button>
          </div>
        </div>
      </Container>
      <Toaster />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "CAD Requests",
  icon: CubeSolid,
})

export default CadRequestsPage
