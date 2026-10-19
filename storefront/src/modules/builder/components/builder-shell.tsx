"use client"

// The builder shell: one client island shared by the five builders. The page around it stays
// server-rendered (question H1, answer, citations). Holds the options (URL-synced), resolves live,
// and renders the form, the Part Number card (badge before price), the actions, the drawing
// (shared BuilderSheet, no 3D), the BOM, the Spec Block and the CAD panel.

import type { BuilderType, Options } from "@lib/cpq/shared"
import { BuilderSheet } from "@lib/cpq/shared/drawing"
import { localBomRows, resolvedBomRows } from "@lib/builder/bom-view"
import { cadKindsLabel } from "@lib/builder/cad"
import { fieldsFor } from "@lib/builder/fields"
import { pricingModeTag, pricingView } from "@lib/builder/pricing-view"
import { ignoredParamsNotice, unitNoun, unitsOf } from "@lib/builder/state"
import { useBuilderState } from "@modules/builder/lib/use-builder-state"
import { useMemo, useState, type ReactNode } from "react"
import BomTable from "./bom-table"
import BuilderActions from "./builder-actions"
import CadPanel from "./cad-panel"
import OptionForm from "./option-form"
import PartNumberCard from "./part-number-card"
import SpecBlock from "./spec-block"
import StockedAlternativeCallout from "./stocked-alternative"

export const LOGO_HREF = "/images/logo/cardinal-logo-ink.svg"

export type BuilderShellProps = {
  type: BuilderType
  initialOptions: Options
  ignored: string[]
  /** Title-block DRAWN date, computed on the server so SSR and hydration agree. */
  drawnDate: string
  formTitle: string
  /** Rendered under the form (e.g. "we can supply" lines, a glycol note). */
  formFooter?: ReactNode
}

export default function BuilderShell({ type, initialOptions, ignored, drawnDate, formTitle, formFooter }: BuilderShellProps) {
  const { options, key, local, status, result, retry, change, error } = useBuilderState(type, initialOptions)
  const [showIgnored, setShowIgnored] = useState(ignored.length > 0)
  const fields = useMemo(() => fieldsFor(type), [type])

  const view = pricingView({ status, result, staticLeadTime: local.leadTime })
  const mode = pricingModeTag(view)
  const done = status === "done" && result ? result : null
  const alt = type === "transition" && done?.stocked_alternative ? done.stocked_alternative : null
  // With a stocked adapter the resolve is the adapter; keep the custom spool's identity for context.
  const partNumber = (!alt && done?.part_number) || local.partNumber
  const description = (!alt && done?.description) || local.description
  const units = unitsOf(type, options)
  const weightLb = done && done.weight_lb_per_unit > 0 ? done.weight_lb_per_unit : local.weightLb
  const reviewReasons = local.standardRange.reasons.map((r) => r.message)
  // Instant lines are added from the resolver's part number (the adapter SKU when stocked).
  const addPartNumber = done?.part_number || partNumber
  const rows = done ? resolvedBomRows(done.bom, local.bom) : localBomRows(local.bom)
  const listTotal = view.price.kind === "price" ? view.price.total : null
  const currency = done?.currency_code || "usd"
  const resolvedSkus = done ? done.bom.map((l) => l.sku) : undefined
  const skusKey = resolvedSkus?.join("|") ?? ""

  // The drawing's layout costs a few ms; rebuild only when its inputs change.
  const drawing = useMemo(
    () => (
      <BuilderSheet
        builderType={type}
        options={options}
        partNumber={partNumber}
        description={description}
        standardRange={local.standardRange}
        drawnDate={drawnDate}
        logoHref={LOGO_HREF}
        pricingMode={mode}
        resolvedSkus={resolvedSkus}
        className="h-auto w-full"
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, partNumber, mode, skusKey, drawnDate],
  )

  const notice = showIgnored ? ignoredParamsNotice(ignored) : null

  return (
    <div className="flex flex-col gap-6" data-testid="builder-shell" data-builder-type={type} data-config-key={key} data-resolve-status={status}>
      {notice ? (
        <div role="status" className="flex items-start justify-between gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="ignored-params-notice">
          <span>{notice}</span>
          <button type="button" className="shrink-0 underline" onClick={() => setShowIgnored(false)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 small:grid-cols-12">
        <div className="small:col-span-5 medium:col-span-4">
          <div className="flex flex-col gap-6 border border-neutral-200 bg-white p-4 xsmall:p-5 small:sticky small:top-28">
            <h2 className="text-lg font-semibold text-neutral-900">{formTitle}</h2>
            <OptionForm fields={fields} options={options} onChange={(k, v) => change(k, v, mode)} error={error} />
            {formFooter}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6 small:col-span-7 medium:col-span-8">
          <PartNumberCard
            partNumber={partNumber}
            description={description}
            view={view}
            unitNoun={unitNoun(type, 1)}
            unitsNoun={unitNoun(type, units)}
            units={units}
            weightLb={weightLb}
            reviewReasons={reviewReasons}
            onRetry={retry}
          />
          {alt ? <StockedAlternativeCallout alt={alt} currency={currency} /> : null}
          <BuilderActions type={type} options={options} partNumber={addPartNumber} pricingMode={mode} cadLabel={cadKindsLabel(type)} />
          <figure className="border border-neutral-200 bg-white p-2" data-testid="builder-drawing">
            {drawing}
            <figcaption className="px-2 pb-1 pt-2 text-xs text-neutral-500">
              {mode === "quote" ? "Reference drawing. Certified drawing on quote approval." : "Reference drawing."}
            </figcaption>
          </figure>
          <BomTable rows={rows} unitNoun={unitNoun(type, 1)} currency={currency} total={listTotal} />
          <SpecBlock text={done?.spec_block || local.specBlock} />
          <CadPanel key={key} type={type} options={options} partNumber={partNumber} pricingMode={mode} reviewReasons={reviewReasons} />
        </div>
      </div>
    </div>
  )
}
