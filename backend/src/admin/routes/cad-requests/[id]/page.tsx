import { Badge, Button, Container, Heading, Label, Text, Textarea, Toaster, toast, usePrompt } from "@medusajs/ui"
import { ReactNode, useEffect, useState } from "react"
import {
  type CadRequestAction,
  cadAdminFileUrl,
  useCadRequest,
  useCadRequestAction,
  useCadSettings,
  useUpdateCadRequest,
} from "../../../hooks/cad-requests"
import {
  BLOCK_REASON_LABEL,
  CAD_STATUS_COLOR,
  CAD_STATUS_LABEL,
  cadRef,
  cadStatusBadge,
  canMarkCadSpam,
  fmtDate,
  formatBytes,
  requesterLabel,
  storefrontShareUrl,
} from "../shared"

/*
  CAD Request detail (CAD Review R6, R10): the PDF in an inline viewer, the STEP download (only for
  builders that have one), the "approved before" note, Approve & send / Reject / Generate now /
  Retry / Resend link / Mark spam, and staff notes.
*/

type UiAction = "approve" | "generate" | "release" | "retry" | "reject" | "resend" | "spam"

const ACTION_COPY: Record<UiAction, { label: string; title: string; description: string; done: string; api: CadRequestAction; danger?: boolean }> = {
  approve: {
    label: "Approve & send",
    title: "Approve these CAD files and send the link?",
    description: "The download link is emailed to the requester now. Check the PDF drawing (and the STEP model if there is one) first.",
    done: "Approved — the download link was emailed",
    api: "approve",
  },
  generate: {
    label: "Generate now",
    title: "Generate this request now?",
    description:
      "The CAD Package is generated now (this does not use the daily cap) and the request moves to Awaiting review. Nothing is sent to the requester until you approve it.",
    done: "Generating — the request will move to Awaiting review",
    api: "release",
  },
  release: {
    label: "Release now",
    title: "Release this request now?",
    description: "The CAD Package is generated and the download link is emailed to the requester. This does not use the daily cap.",
    done: "Released — the link will be emailed shortly",
    api: "release",
  },
  retry: {
    label: "Retry",
    title: "Retry this request?",
    description: "Generation is attempted again. A request never approved goes to Awaiting review; an approved one is sent.",
    done: "Retry started",
    api: "release",
  },
  reject: {
    label: "Reject",
    title: "Reject this request?",
    description: "The requester gets nothing, and the request stops counting toward their allowance.",
    done: "Rejected",
    api: "reject",
    danger: true,
  },
  resend: {
    label: "Resend link",
    title: "Resend the download link?",
    description: "A new link is emailed. The old link stops working immediately.",
    done: "A new link will be emailed shortly",
    api: "resend",
  },
  spam: {
    label: "Mark spam",
    title: "Mark this request as spam?",
    description: "Any emailed link stops working. The request still counts toward the requester's allowance, and no email is sent.",
    done: "Marked as spam",
    api: "spam",
    danger: true,
  },
}

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <Label className="text-sm font-medium">{label}</Label>
    <div className="text-ui-fg-base mt-1 text-sm">{value}</div>
  </div>
)

const CadRequestDetailPage = () => {
  // Admin routes run inside the dashboard router; read the id from the URL (no react-router dep).
  const id = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() ?? "" : ""
  const { data, isPending, isError } = useCadRequest(id)
  const { data: settings } = useCadSettings()
  const reviewOn = settings?.require_review !== false
  const r = data?.cad_request
  const prompt = usePrompt()

  const [staffNotes, setStaffNotes] = useState("")
  useEffect(() => {
    if (r) setStaffNotes(r.staff_notes ?? "")
  }, [r?.id, r?.staff_notes])

  const notesMut = useUpdateCadRequest(id)
  const actionMut = useCadRequestAction(id)

  if (isPending) {
    return (
      <Container>
        <Text>Loading…</Text>
      </Container>
    )
  }
  if (isError || !data || !r) {
    return (
      <Container>
        <Text className="text-ui-fg-error">Could not load this CAD Request.</Text>
      </Container>
    )
  }

  const pkg = data.package
  const notesDirty = staffNotes !== (r.staff_notes ?? "")
  const actions: UiAction[] = []
  if (r.status === "review") actions.push("approve", "reject")
  if (r.status === "queued") actions.push(reviewOn ? "generate" : "release", "reject")
  if (r.status === "failed") actions.push("retry")
  if (r.status === "emailed" || r.status === "ready") actions.push("resend")
  if (canMarkCadSpam(r)) actions.push("spam")

  const run = async (a: UiAction) => {
    const copy = ACTION_COPY[a]
    const ok = await prompt({ title: copy.title, description: copy.description, confirmText: copy.label, cancelText: "Cancel" })
    if (!ok) return
    const withNotes = (a === "reject" || a === "spam") && notesDirty ? { staff_notes: staffNotes.trim() ? staffNotes : null } : {}
    actionMut.mutate(
      { action: copy.api, ...withNotes },
      {
        onSuccess: (res) => {
          if (a === "approve" && res?.cad_request?.status !== "emailed") {
            toast.error("Approved, but the link could not be sent", {
              description: res?.cad_request?.error || "It will be retried automatically every hour.",
            })
          } else {
            toast.success(copy.done)
          }
        },
        onError: (e: any) => toast.error("Action failed", { description: e?.message || "Unknown error" }),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="p-6 flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <Heading className="font-sans font-medium h1-core">
              {cadRef(r.display_id)} · {r.part_number}
            </Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {r.description}
              <br />
              Requested {fmtDate(r.created_at)}
              {r.source_page ? ` from ${r.source_page}` : ""}
            </Text>
          </div>
          <div className="flex gap-2">
            <Badge size="base" color="grey">
              {r.builder_title}
            </Badge>
            <Badge size="base" color={cadStatusBadge(r).color}>
              {cadStatusBadge(r).label}
            </Badge>
          </div>
        </div>

        {data.approved_before && (
          <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-3">
            <Text size="small">
              Files for this Part Number were approved before:{" "}
              <a href={`/app/cad-requests/${data.approved_before.id}`} className="text-ui-fg-interactive hover:underline">
                {cadRef(data.approved_before.display_id)}
              </a>{" "}
              on {new Date(data.approved_before.approved_at).toLocaleDateString()}. Check who is asking; the drawing itself was
              already checked.
            </Text>
          </div>
        )}
        {r.status === "blocked" && r.block_reason && (
          <Text className="text-ui-fg-error">Blocked: {BLOCK_REASON_LABEL[r.block_reason]}</Text>
        )}
        {r.error && (
          <div className="rounded-md border border-ui-border-error bg-ui-bg-subtle p-3">
            <Text weight="plus">Last error (attempt {r.attempts})</Text>
            <Text size="small" className="text-ui-fg-subtle whitespace-pre-wrap">
              {r.error}
            </Text>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Requester" value={requesterLabel(r)} />
          <Field label="Company" value={r.company_name || data.customer?.company_name || "—"} />
          <Field label="Email" value={r.email || "—"} />
          <Field label="Counted toward allowance" value={r.counted ? "Yes" : r.is_customer ? "No (signed-in customer)" : "No"} />
          <Field label="IP" value={r.client_ip ? `${r.client_ip} (${r.ip_source ?? "unknown"})` : "—"} />
          {r.is_customer && r.customer_id ? (
            <Field
              label="Customer"
              value={
                <a href={`/app/customers/${r.customer_id}`} className="text-ui-fg-interactive hover:underline">
                  {data.customer?.email ?? r.customer_id}
                </a>
              }
            />
          ) : data.matched_customer ? (
            <Field
              label="Matches a customer account"
              value={
                <a href={`/app/customers/${data.matched_customer.id}`} className="text-ui-fg-interactive hover:underline">
                  {data.matched_customer.email}
                </a>
              }
            />
          ) : null}
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {actions.map((a) => (
              <Button
                key={a}
                variant={ACTION_COPY[a].danger ? "danger" : a === "approve" || a === "generate" ? "primary" : "secondary"}
                size="small"
                disabled={actionMut.isPending}
                isLoading={actionMut.isPending && actionMut.variables?.action === ACTION_COPY[a].api}
                onClick={() => run(a)}
              >
                {ACTION_COPY[a].label}
              </Button>
            ))}
          </div>
        )}
      </Container>

      {pkg?.status === "ready" && (
        <Container className="p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <Heading level="h2">{r.status === "review" ? "Review the CAD files" : "CAD files"}</Heading>
            <div className="flex gap-2">
              {pkg.has_step ? (
                <a href={cadAdminFileUrl(r.id, "step")} download>
                  <Button size="small" variant="secondary" type="button">
                    Download STEP ({formatBytes(pkg.step_bytes)})
                  </Button>
                </a>
              ) : null}
              <a href={cadAdminFileUrl(r.id, "pdf")} target="_blank" rel="noreferrer">
                <Button size="small" variant="secondary" type="button">
                  Open PDF in a new tab
                </Button>
              </a>
            </div>
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle">
            {pkg.has_step
              ? "Staff copies: these downloads don't count toward the requester's link."
              : `PDF only: a ${r.builder_title} is several stocked parts, not one solid, so there is no STEP. Staff copies don't count toward the requester's link.`}
          </Text>
          <iframe
            title={`${r.part_number} drawing (PDF)`}
            src={cadAdminFileUrl(r.id, "pdf")}
            className="w-full rounded-md border border-ui-border-base bg-ui-bg-subtle"
            style={{ height: "70vh", minHeight: 480 }}
          />
        </Container>
      )}

      <Container className="p-6 flex flex-col gap-3">
        <Heading level="h2">Configuration</Heading>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ui-fg-subtle">Part Number</dt>
          <dd className="font-mono">{r.part_number}</dd>
          {r.configuration_display.map((row, i) => (
            <div key={i} className="contents">
              <dt className="text-ui-fg-subtle">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {r.share_path && (
          <Text size="xsmall" className="text-ui-fg-subtle">
            Builder link:{" "}
            <a href={storefrontShareUrl(r.share_path)} target="_blank" rel="noreferrer" className="text-ui-fg-interactive hover:underline font-mono">
              {r.share_path}
            </a>
          </Text>
        )}
      </Container>

      <Container className="p-6 flex flex-col gap-3">
        <Heading level="h2">CAD Package and delivery</Heading>
        <div className="grid grid-cols-2 gap-4">
          {pkg ? (
            <>
              <Field label="Package status" value={pkg.status} />
              <Field label="Generated" value={fmtDate(pkg.generated_at)} />
              <Field
                label="Files"
                value={pkg.has_step ? `STEP ${formatBytes(pkg.step_bytes)} · PDF ${formatBytes(pkg.pdf_bytes)}` : `PDF ${formatBytes(pkg.pdf_bytes)} (no STEP)`}
              />
              <Field
                label="Versions"
                value={`generator v${pkg.generator_version} · drawing v${pkg.drawing_version} · tables ${pkg.tables_hash}`}
              />
              <Field label="Counted against the daily cap" value={pkg.counted_against_cap ? `Yes (${pkg.cap_day})` : "No"} />
            </>
          ) : (
            <Field label="Package" value="Not generated yet" />
          )}
          <Field
            label="Download link"
            value={!r.token.issued ? "Not issued" : r.token.expired ? `Expired ${fmtDate(r.token.expires_at)}` : `Expires ${fmtDate(r.token.expires_at)}`}
          />
          <Field
            label="Downloads used"
            value={`${r.token.downloads_used} / ${r.token.downloads_used + r.token.downloads_remaining}${
              r.last_downloaded_at ? ` (last ${fmtDate(r.last_downloaded_at)})` : ""
            }`}
          />
          <Field label="Emailed" value={fmtDate(r.emailed_at)} />
          {r.approved_at && <Field label="Approved" value={`${fmtDate(r.approved_at)} by ${r.approved_by ?? "—"}`} />}
          {r.queued_at && <Field label="Queued" value={fmtDate(r.queued_at)} />}
          {r.released_at && (
            <Field
              label="Released"
              value={`${fmtDate(r.released_at)} by ${r.released_by === "auto" ? "the queue job" : r.released_by ?? "—"}`}
            />
          )}
        </div>
      </Container>

      <Container className="p-6 flex flex-col gap-3">
        <Heading level="h2">Other CAD Requests from this email</Heading>
        {data.history.cad_requests.length === 0 ? (
          <Text size="small" className="text-ui-fg-muted">
            None.
          </Text>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.history.cad_requests.map((h) => (
              <li key={h.id} className="flex gap-3 items-center">
                <a href={`/app/cad-requests/${h.id}`} className="text-ui-fg-interactive hover:underline">
                  {cadRef(h.display_id)}
                </a>
                <span className="font-mono text-xs">{h.part_number}</span>
                <Badge size="2xsmall" color={CAD_STATUS_COLOR[h.status]}>
                  {CAD_STATUS_LABEL[h.status]}
                </Badge>
                <Text size="small" className="text-ui-fg-subtle">
                  {fmtDate(h.created_at)}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Container>

      <Container className="p-6 flex flex-col gap-3">
        <Label className="text-sm font-medium" htmlFor="cad-staff-notes">
          Staff notes
        </Label>
        <Textarea
          id="cad-staff-notes"
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          rows={4}
          placeholder="Internal — never shown to the requester."
        />
        <div>
          <Button
            variant="secondary"
            size="small"
            disabled={!notesDirty || notesMut.isPending}
            onClick={() =>
              notesMut.mutate(
                { staff_notes: staffNotes.trim() ? staffNotes : null },
                {
                  onSuccess: () => toast.success("Staff notes saved"),
                  onError: (e: any) => toast.error("Save failed", { description: e?.message || "Unknown error" }),
                }
              )
            }
          >
            Save
          </Button>
        </div>
      </Container>
      <Toaster />
    </div>
  )
}

export default CadRequestDetailPage
