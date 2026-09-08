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
import { convertToLocale } from "@lib/util/money"
import {
  amberPillClass,
  btnPrimary,
  btnSecondary,
  captionClass,
  inputClass,
  skuClass,
  tableHeadClass,
} from "../portal-ui"
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
          className={`w-full rounded-[5px] border-2 border-dashed px-6 py-6 text-left transition-colors motion-reduce:transition-none ${
            dragOver
              ? "border-[#E3000F] bg-[rgba(227,0,15,0.04)]"
              : "border-gray-300 bg-gray-50 hover:border-[#E3000F] hover:bg-[rgba(227,0,15,0.03)]"
          }`}
          data-testid="po-upload-dropzone"
        >
          <span className="flex items-center gap-2.5 text-[17px] font-semibold text-[#111111]">
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[5px]"
              style={{ backgroundColor: "rgba(227,0,15,0.08)" }}
              aria-hidden="true"
            >
              <svg
                className="h-4 w-4"
                style={{ color: "#E3000F" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </span>
            Drop your PO here (PDF) — we&apos;ll fill the table for you
          </span>
          <span className="block text-[15px] text-[#6b7280] mt-1.5 pl-[42px]">
            Or click to choose a file. PDF or a photo (PNG, JPEG, WebP), up to
            15MB.
          </span>
        </button>
      )}

      {/* Reading — persistent, visibly alive; blocks a second upload. */}
      {status.kind === "reading" && (
        <div
          className="w-full rounded-[5px] border border-gray-200 bg-gray-50 px-6 py-6 flex items-center gap-4"
          role="status"
          data-testid="po-upload-reading"
        >
          <span
            aria-hidden="true"
            className="inline-block h-8 w-8 flex-shrink-0 rounded-full border-4 border-[#E3000F] border-t-transparent animate-spin motion-reduce:animate-none"
          />
          <div>
            <p className="text-[17px] font-semibold text-[#111111] m-0">
              Reading your PO&hellip;
            </p>
            <p className="text-[15px] text-[#374151] m-0 mt-1">
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
          className="w-full rounded-[5px] border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-800"
          role="alert"
          data-testid="po-upload-error"
        >
          {status.message}
        </div>
      )}

      {/* Small persistent confirmation line after loading. */}
      {status.kind === "done" && (
        <div
          className="w-full rounded-[5px] border border-green-300 bg-green-50 px-4 py-3 text-[15px] text-green-900 flex items-start justify-between gap-3"
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
          className="rounded-[5px] border border-gray-200 bg-white shadow-sm"
          data-testid="po-readout"
        >
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 rounded-t-[5px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-semibold tracking-tight text-[#111111] m-0">
                  We read PO{" "}
                  <span className="font-mono">
                    {readOut.po_number || "(no number found)"}
                  </span>
                </h3>
                <p className="text-[15px] text-[#374151] m-0 mt-1">
                  Check every line before you continue. Fix quantities or
                  remove lines that don&apos;t belong.
                </p>
              </div>
              {readOut.file_url && (
                <a
                  href={readOut.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-medium text-[#111111] underline underline-offset-2 whitespace-nowrap hover:text-[#E3000F]"
                >
                  View original
                </a>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${tableHeadClass} border-b border-gray-200`}>
                  <th className="px-4 py-2 font-medium">On your PO</th>
                  <th className="px-4 py-2 font-medium w-24 text-right">Qty</th>
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
                    <tr
                      key={row.rowId}
                      className="border-b border-gray-100 last:border-b-0 align-top transition-colors motion-reduce:transition-none hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 max-w-[260px]">
                        <span
                          title={row.description}
                          className="block text-[15px] text-[#374151] truncate"
                        >
                          {row.description}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          disabled={status.kind === "loading"}
                          onChange={(e) =>
                            setRowQty(row.rowId, Number(e.target.value))
                          }
                          aria-label={`Quantity for ${row.description}`}
                          className={`${inputClass} w-20 text-right tabular-nums`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {matched ? (
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className={skuClass}>
                                {row.variant!.sku}
                              </span>
                              <span className={`${captionClass} ml-2`}>
                                {row.variant!.title}
                              </span>
                            </div>
                            <div className="text-[15px] tabular-nums text-[#374151]">
                              {row.variant!.unit_price != null
                                ? `${fmt(row.variant!.unit_price)} each — our price applies`
                                : "Price to be quoted"}
                            </div>
                            {row.price_alarm &&
                              row.unit_price != null &&
                              row.variant!.unit_price != null && (
                                <div className={`${amberPillClass} px-2 py-1 w-fit`}>
                                  PO price {fmt(row.unit_price)} is lower
                                  than our price {fmt(row.variant!.unit_price)}
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className={`${amberPillClass} px-2 py-1 w-fit whitespace-normal`}>
                            Not matched — we&apos;ll send it as a quote, or
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
                          className="w-10 h-10 flex items-center justify-center rounded-[5px] border border-gray-300 text-[18px] text-[#E3000F] hover:bg-[rgba(227,0,15,0.06)] disabled:opacity-40"
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
                      className="px-4 py-8 text-center text-[15px] text-[#6b7280]"
                    >
                      All lines removed. Close this panel or upload a
                      different PO.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-gray-200 flex flex-col gap-3">
            {unmatchedRows.length > 0 && (
              <p className="text-[15px] text-amber-800 m-0">
                {unmatchedRows.length} unmatched{" "}
                {unmatchedRows.length === 1 ? "line" : "lines"} will ride along
                in your quote note for Cardinal to price.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={dismissReadOut}
                disabled={status.kind === "loading"}
                className={`${btnSecondary} px-6`}
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleLoad}
                disabled={status.kind === "loading" || activeRows.length === 0}
                className={`${btnPrimary} px-8`}
                data-testid="po-readout-load"
              >
                {status.kind === "loading"
                  ? "Loading your parts…"
                  : "Load into Quick Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
