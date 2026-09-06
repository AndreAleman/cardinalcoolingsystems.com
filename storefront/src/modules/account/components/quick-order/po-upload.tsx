"use client"

/*
  PO Upload (CONTEXT.md) — the affordance on the Dashboard's Quick Order
  where a Team Member drops a purchase-order PDF/image. The backend's AI
  reader answers with a PO Read-Out: an on-screen verify table the buyer
  checks and fixes BEFORE anything enters the Quick Order draft.

  Flow: idle drop zone → "Reading your PO…" (30–60s, visibly alive) →
  PO Read-Out panel (editable qty, remove rows, Price Alarm badges) →
  "Load into Quick Order" hands matched lines to the parent (which
  hydrates them through the same path Order Again/Favorites use) and
  collapses this panel to a small persistent confirmation line. The
  buyer then submits with the NORMAL Quick Order buttons — this
  component builds no submit path of its own.

  Prices shown are always Cardinal's, never the PO's: a PO price LOWER
  than Cardinal's raises a Price Alarm; a higher one is silently
  replaced (we only show Cardinal's price as the price that applies).

  Persistent panels, not toasts; large controls and plain words — the
  audience is older and non-technical.
*/

import { useRef, useState } from "react"
import { Button, Input } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import { capturePortalEvent } from "@lib/util/portal-analytics"
import {
  uploadPurchaseOrder,
  type PoReadOut,
  type PoReadOutLine,
} from "@lib/data/order-form"

const MAX_FILE_BYTES = 15 * 1024 * 1024 // matches the backend's ~15MB cap
const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
}

/* One verify-table row: a Read-Out line plus its editable/removable state. */
type ReadOutRow = PoReadOutLine & { rowId: number; removed: boolean }

export type PoLoadedPayload = {
  poNumber: string | null
  /* Stored original of the uploaded PO (the Read-Out's file_url) — kept
     so the document can travel with the eventual order/quote. */
  fileUrl: string | null
  /* Matched lines to hydrate + add to the Quick Order draft. */
  matched: { variantId: string; quantity: number }[]
  /* Unmatched lines to carry in the quote note ("Also quote: …"). */
  unmatched: { description: string; quantity: number }[]
}

type Status =
  | { kind: "idle" }
  | { kind: "reading"; filename: string }
  | { kind: "error"; message: string }
  | { kind: "readout" }
  | { kind: "loading" }
  | {
      kind: "done"
      poNumber: string | null
      loadedCount: number
      unmatchedCount: number
      droppedCount: number
    }

type Props = {
  currencyCode: string
  /*
    Called on "Load into Quick Order". Must resolve with how many matched
    lines actually made it into the draft (hydration can drop a variant
    that has since disappeared from the catalog).
  */
  onLoad: (payload: PoLoadedPayload) => Promise<{ loadedCount: number }>
}

export default function PoUpload({ currencyCode, onLoad }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [readOut, setReadOut] = useState<PoReadOut | null>(null)
  const [rows, setRows] = useState<ReadOutRow[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fmt = (amount: number) =>
    convertToLocale({ amount, currency_code: currencyCode || "usd" })

  const busy = status.kind === "reading" || status.kind === "loading"

  /* ---- File intake ---- */

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result ?? "")
        const comma = result.indexOf(",")
        if (comma < 0) {
          reject(new Error("Could not read the file."))
          return
        }
        resolve(result.slice(comma + 1))
      }
      reader.onerror = () => reject(new Error("Could not read the file."))
      reader.readAsDataURL(file)
    })

  const handleFile = async (file: File | null | undefined) => {
    if (!file || busy) return

    if (!ACCEPTED_TYPES[file.type]) {
      setStatus({
        kind: "error",
        message:
          "That file type won't work. Please upload your PO as a PDF, or a photo of it (PNG, JPEG, or WebP).",
      })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus({
        kind: "error",
        message:
          "That file is too large (over 15MB). Please upload a smaller PDF or photo of your PO.",
      })
      return
    }

    setStatus({ kind: "reading", filename: file.name })
    try {
      const base64 = await readFileAsBase64(file)
      const result = await uploadPurchaseOrder({
        name: file.name,
        type: file.type,
        base64,
      })
      if ("error" in result) {
        setStatus({ kind: "error", message: result.error })
        return
      }
      setReadOut(result)
      setRows(
        result.lines.map((line, i) => ({ ...line, rowId: i, removed: false }))
      )
      setStatus({ kind: "readout" })
      capturePortalEvent("po_uploaded", {
        lines: result.lines.length,
        matched: result.lines.filter((l) => !l.unmatched && l.variant).length,
        unmatched: result.lines.filter((l) => l.unmatched || !l.variant).length,
      })
    } catch (err: any) {
      setStatus({
        kind: "error",
        message:
          err?.message ??
          "Something went wrong reading your PO. Please try again.",
      })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const openFilePicker = () => {
    if (!busy) fileInputRef.current?.click()
  }

  /* ---- Read-Out edits ---- */

  const setRowQty = (rowId: number, qty: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.rowId === rowId ? { ...r, quantity: Math.max(1, qty || 1) } : r
      )
    )
  }

  const removeRow = (rowId: number) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, removed: true } : r))
    )
  }

  const activeRows = rows.filter((r) => !r.removed)
  const matchedRows = activeRows.filter((r) => !r.unmatched && r.variant)
  const unmatchedRows = activeRows.filter((r) => r.unmatched || !r.variant)

  /* ---- Load into Quick Order ---- */

  const handleLoad = async () => {
    if (!readOut || !activeRows.length) return
    setStatus({ kind: "loading" })
    try {
      const { loadedCount } = await onLoad({
        poNumber: readOut.po_number,
        fileUrl: readOut.file_url,
        matched: matchedRows.map((r) => ({
          variantId: r.variant!.id,
          quantity: r.quantity,
        })),
        unmatched: unmatchedRows.map((r) => ({
          description: r.description,
          quantity: r.quantity,
        })),
      })
      setStatus({
        kind: "done",
        poNumber: readOut.po_number,
        loadedCount,
        unmatchedCount: unmatchedRows.length,
        droppedCount: matchedRows.length - loadedCount,
      })
      setReadOut(null)
      setRows([])
    } catch (err: any) {
      // Back to the verify table with a visible message — nothing is lost.
      setStatus({
        kind: "error",
        message:
          err?.message ??
          "Couldn't load the lines into your order. Please try again.",
      })
    }
  }

  const dismissReadOut = () => {
    setReadOut(null)
    setRows([])
    setStatus({ kind: "idle" })
  }

  /* ---- Render ---- */

  return (
    <div data-testid="po-upload" className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Drop zone — hidden while a Read-Out is on screen. */}
      {(status.kind === "idle" ||
        status.kind === "error" ||
        status.kind === "done") && (
        <button
          type="button"
          onClick={openFilePicker}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={`w-full max-w-2xl rounded-lg border-2 border-dashed px-6 py-6 text-left transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-neutral-300 bg-neutral-50 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
          data-testid="po-upload-dropzone"
        >
          <span className="block text-[18px] font-semibold text-neutral-800">
            📄 Drop your PO here (PDF) — we&apos;ll fill the table for you
          </span>
          <span className="block text-[15px] text-neutral-500 mt-1">
            Or click to choose a file. PDF or a photo (PNG, JPEG, WebP), up to
            15MB.
          </span>
        </button>
      )}

      {/* Reading — persistent, visibly alive; blocks a second upload. */}
      {status.kind === "reading" && (
        <div
          className="w-full max-w-2xl rounded-lg border-2 border-blue-300 bg-blue-50 px-6 py-6 flex items-center gap-4"
          role="status"
          data-testid="po-upload-reading"
        >
          <span
            aria-hidden="true"
            className="inline-block h-8 w-8 flex-shrink-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
          />
          <div>
            <p className="text-[18px] font-semibold text-blue-900 m-0">
              Reading your PO&hellip;
            </p>
            <p className="text-[15px] text-blue-800 m-0 mt-1">
              We&apos;re reading &ldquo;{status.filename}&rdquo; line by line.
              This usually takes 30&ndash;60 seconds — please keep this page
              open.
            </p>
          </div>
        </div>
      )}

      {/* Error — persistent panel, not a toast. */}
      {status.kind === "error" && (
        <div
          className="w-full max-w-2xl rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[16px] text-red-800"
          role="alert"
          data-testid="po-upload-error"
        >
          {status.message}
        </div>
      )}

      {/* Small persistent confirmation line after loading. */}
      {status.kind === "done" && (
        <div
          className="w-full max-w-2xl rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-[16px] text-green-900 flex items-start justify-between gap-3"
          data-testid="po-upload-done"
        >
          <span>
            ✓ PO {status.poNumber || "(no number found)"}:{" "}
            {status.loadedCount}{" "}
            {status.loadedCount === 1 ? "line" : "lines"} loaded into your
            order below
            {status.unmatchedCount > 0 &&
              ` — ${status.unmatchedCount} unmatched ${
                status.unmatchedCount === 1 ? "line" : "lines"
              } added to your quote note`}
            {status.droppedCount > 0 &&
              ` (${status.droppedCount} matched ${
                status.droppedCount === 1 ? "part is" : "parts are"
              } no longer in our catalog and couldn't be added)`}
            .
          </span>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            aria-label="Dismiss PO confirmation"
            className="text-green-700 hover:text-green-900 text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* ---- The PO Read-Out: verify table ---- */}
      {(status.kind === "readout" || status.kind === "loading") && readOut && (
        <div
          className="rounded-lg border-2 border-blue-300 bg-white shadow-sm"
          data-testid="po-readout"
        >
          <div className="px-5 py-4 border-b bg-blue-50 rounded-t-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[20px] font-semibold m-0">
                  We read PO{" "}
                  <span className="font-mono">
                    {readOut.po_number || "(no number found)"}
                  </span>
                </h3>
                <p className="text-[16px] text-neutral-700 m-0 mt-1">
                  Check every line before you continue. Fix quantities or
                  remove lines that don&apos;t belong.
                </p>
              </div>
              {readOut.file_url && (
                <a
                  href={readOut.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] text-blue-700 underline whitespace-nowrap"
                >
                  View original
                </a>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[14px] text-neutral-500 border-b">
                  <th className="px-4 py-2 font-medium">On your PO</th>
                  <th className="px-4 py-2 font-medium w-24">Qty</th>
                  <th className="px-4 py-2 font-medium">Our matching part</th>
                  <th className="px-4 py-2 font-medium w-14">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row) => {
                  const matched = !row.unmatched && row.variant
                  return (
                    <tr key={row.rowId} className="border-b last:border-b-0 align-top">
                      <td className="px-4 py-3 max-w-[260px]">
                        <span
                          title={row.description}
                          className="block text-[16px] text-neutral-800 truncate"
                        >
                          {row.description}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          disabled={status.kind === "loading"}
                          onChange={(e) =>
                            setRowQty(row.rowId, Number(e.target.value))
                          }
                          aria-label={`Quantity for ${row.description}`}
                          className="w-20 h-12 text-[16px]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {matched ? (
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="font-mono text-[16px] font-semibold">
                                {row.variant!.sku}
                              </span>
                              <span className="text-[15px] text-neutral-600 ml-2">
                                {row.variant!.title}
                              </span>
                            </div>
                            <div className="text-[16px] tabular-nums">
                              {row.variant!.unit_price != null
                                ? `${fmt(row.variant!.unit_price)} each — our price applies`
                                : "Price to be quoted"}
                            </div>
                            {row.price_alarm &&
                              row.unit_price != null &&
                              row.variant!.unit_price != null && (
                                <div className="text-[14px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 w-fit">
                                  ⚠ PO price {fmt(row.unit_price)} is lower
                                  than our price {fmt(row.variant!.unit_price)}
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="text-[15px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 w-fit">
                            NOT MATCHED — we&apos;ll send it as a quote, or
                            remove this line and pick the part from the search
                            below
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeRow(row.rowId)}
                          disabled={status.kind === "loading"}
                          aria-label={`Remove line ${row.description}`}
                          className="w-10 h-10 flex items-center justify-center rounded border border-neutral-200 text-[18px] text-red-700 hover:bg-red-50 disabled:opacity-40"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {activeRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-center text-[16px] text-neutral-500"
                    >
                      All lines removed. Close this panel or upload a
                      different PO.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t flex flex-col gap-3">
            {unmatchedRows.length > 0 && (
              <p className="text-[15px] text-amber-800 m-0">
                {unmatchedRows.length} unmatched{" "}
                {unmatchedRows.length === 1 ? "line" : "lines"} will ride along
                in your quote note for Cardinal to price.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                size="large"
                onClick={dismissReadOut}
                disabled={status.kind === "loading"}
                className="h-12 px-6 text-[17px]"
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="large"
                onClick={handleLoad}
                disabled={status.kind === "loading" || activeRows.length === 0}
                className="h-12 px-8 text-[18px]"
                data-testid="po-readout-load"
              >
                {status.kind === "loading"
                  ? "Loading your parts…"
                  : "Load into Quick Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
