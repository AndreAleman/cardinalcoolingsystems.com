"use client"

// The builder shell: one client island shared by the five builders. The page around it stays
// server-rendered (question H1, answer, citations). Holds the options (URL-synced), resolves live,
// and renders, in reading order (David's review, Oct 20):
//   1. the result line (count first, then the resolve's price or the quote promise);
//   2. the primary questions, then one collapsed "Options" section (lib/primary-fields.ts);
//   3. the Part Number card (badge before price) and Add to Quote List;
//   4. the picture: the kit schematic (cdu-kit) or the shared drawing (geometry builders);
//   5. the one BOM table;
//   6. below the buyer's path to the price: the Spec Block and the CAD panel.

import { cadBlockingRangeReasons, type BuilderType, type Options } from "@lib/cpq/shared"
import { BuilderSheet } from "@lib/cpq/shared/drawing"
import { localBomRows, resolvedBomRows } from "@lib/builder/bom-view"
import { cadKindsLabel } from "@lib/builder/cad"
import { fieldsFor } from "@lib/builder/fields"
import { formatAsOf, pricingModeTag, pricingView } from "@lib/builder/pricing-view"
import { ignoredParamsNotice, unitNoun, unitsOf } from "@lib/builder/state"
import { optionsSummary, splitFields } from "@modules/builder/lib/primary-fields"
import { resultSummary, summaryBom } from "@modules/builder/lib/result-summary"
import { useBuilderState } from "@modules/builder/lib/use-builder-state"
import { useMemo, useState, type ReactNode } from "react"
import BomTable from "./bom-table"
import BuilderActions from "./builder-actions"
import CadPanel from "./cad-panel"
import CduPicker from "./cdu-picker"
import OptionForm from "./option-form"
import OptionsDisclosure from "./options-disclosure"
import PartNumberCard from "./part-number-card"
import ResultLine from "./result-line"
import { KitSchematic, kitSchematicCaption } from "./schematic/kit-schematic"
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
  /** Rendered at the end of the Options section (e.g. the glycol note). */
  formFooter?: ReactNode
}

export default function BuilderShell({ type, initialOptions, ignored, drawnDate, formTitle, formFooter }: BuilderShellProps) {
  const { options, key, local, status, result, retry, change, error } = useBuilderState(type, initialOptions)
  const [showIgnored, setShowIgnored] = useState(ignored.length > 0)
  const fields = useMemo(() => fieldsFor(type), [type])
  const { primary, advanced } = useMemo(() => splitFields(type, fields), [type, fields])
  const isKit = type === "cdu-kit"
  // The kit's first question is the combined CDU / port picker; the rest render as fields.
  const primaryFields = isKit ? primary.filter((f) => f.key !== "cdu") : primary

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
  // Advisory flags (a header over one stick, a DN port to confirm) still get CAD files (backend rule).
  const cadBlockers = cadBlockingRangeReasons(local.standardRange).map((r) => r.message)
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
  const summary = resultSummary({
    builderType: type,
    options,
    units,
    bom: summaryBom(done, local.bom),
    view,
    stockedSku: alt?.sku ?? null,
  })
  const advancedError = !!error && advanced.some((f) => f.key === error.key)

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

      <ResultLine summary={summary} reviewReasons={reviewReasons} />

      <div className="grid grid-cols-1 gap-6 small:grid-cols-12">
        <div className="small:col-span-5 medium:col-span-4">
          <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 xsmall:p-5 small:sticky small:top-28" data-testid="builder-questions">
            <h2 className="sr-only">{formTitle}</h2>
            {isKit ? <CduPicker fields={fields} options={options} onChange={(k, v) => change(k, v, mode)} error={error} /> : null}
            <OptionForm fields={primaryFields} options={options} onChange={(k, v) => change(k, v, mode)} error={error} layout="grid" />
            {advanced.length ? (
              <OptionsDisclosure summary={optionsSummary(type, options, advanced)} forceOpen={advancedError}>
                <div className="flex flex-col gap-5">
                  <OptionForm
                    fields={advanced}
                    options={options}
                    onChange={(k, v) => change(k, v, mode)}
                    error={error}
                    testId="builder-form-options"
                  />
                  {formFooter}
                </div>
              </OptionsDisclosure>
            ) : (
              formFooter
            )}
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
            reviewReasons={[]}
            onRetry={retry}
          />
          {alt ? <StockedAlternativeCallout alt={alt} currency={currency} /> : null}
          <BuilderActions type={type} options={options} partNumber={addPartNumber} pricingMode={mode} cadLabel={cadKindsLabel(type)} />
          {isKit ? (
            <figure className="border border-neutral-200 bg-white px-3 py-3 xsmall:px-4" data-testid="kit-schematic-figure">
              <div className="hidden xsmall:block">
                <KitSchematic options={options} title="CDU hookup kit schematic" className="mx-auto h-auto w-full max-w-[720px]" />
              </div>
              <figcaption className="text-sm text-neutral-700 xsmall:mt-2 xsmall:text-xs xsmall:text-neutral-500" data-testid="kit-schematic-caption">
                {kitSchematicCaption(options)}
              </figcaption>
            </figure>
          ) : (
            <figure className="border border-neutral-200 bg-white p-2" data-testid="builder-drawing">
              {/* Phones: the sheet keeps a readable size and scrolls sideways instead of shrinking. */}
              <div className="-mx-2 overflow-x-auto px-2 xsmall:mx-0 xsmall:overflow-visible xsmall:px-0">
                <div className="min-w-[680px] xsmall:min-w-0">{drawing}</div>
              </div>
              <figcaption className="px-2 pb-1 pt-2 text-xs text-neutral-500">
                {mode === "quote" ? "Reference drawing. Certified drawing on quote approval." : "Reference drawing."}
                <span className="xsmall:hidden"> Scroll sideways for the full sheet.</span>
              </figcaption>
            </figure>
          )}
          <BomTable
            rows={rows}
            unitNoun={unitNoun(type, 1)}
            currency={currency}
            total={listTotal}
            basis={done ? done.price_basis : null}
            asOf={done ? formatAsOf(done.priced_at) : ""}
          />
          <SpecBlock text={done?.spec_block || local.specBlock} />
          <CadPanel key={key} type={type} options={options} partNumber={partNumber} pricingMode={mode} reviewReasons={cadBlockers} />
        </div>
      </div>
    </div>
  )
}
