// The Engineering View sheet for any builder configuration. A registry maps builder_type → sheet
// (no switch): the transition, manifold, strainer and hose draw their part; the CDU kit draws its BOM
// table. Used by the storefront, the CAD download page and the backend PDF render. Plain SVG, no hooks.

import type { ReactElement } from "react"
import {
  getBuilder,
  hoseGeometry,
  kitBom,
  kitWeight,
  manifoldGeometry,
  strainerGeometry,
  transitionGeometry,
} from "../index"
import type { BuilderType, Options, OptionsByType, StandardRange } from "../types"
import { HoseSheet, StrainerSheet, TransitionSheet } from "./axial-sheets"
import { KitSheet } from "./kit-sheet"
import { ManifoldSheet } from "./manifold-sheet"
import type { PricingModeTag } from "./title-block"

type Common = {
  resolvedSkus?: (string | null)[]
  partNumber: string
  description: string
  standardRange: StandardRange
  drawnDate: string
  logoHref: string
  pricingMode?: PricingModeTag
  print?: boolean
  className?: string
}

export const BUILDER_SHEETS: { readonly [T in BuilderType]: (o: OptionsByType[T], p: Common) => ReactElement } = {
  transition: (o, { resolvedSkus: _r, ...p }) => <TransitionSheet geometry={transitionGeometry(o)} {...p} />,
  "row-manifold": (o, { resolvedSkus: _r, ...p }) => <ManifoldSheet geometry={manifoldGeometry(o)} {...p} />,
  strainer: (o, { resolvedSkus: _r, ...p }) => <StrainerSheet geometry={strainerGeometry(o)} {...p} />,
  hose: (o, { resolvedSkus: _r, ...p }) => <HoseSheet geometry={hoseGeometry(o)} {...p} />,
  "cdu-kit": (o, p) => <KitSheet bom={kitBom(o)} weightLb={kitWeight(o).per_unit_lb} {...p} />,
}

export type BuilderSheetProps = {
  builderType: BuilderType
  /** Canonical (decoded or validated) options of that builder. */
  options: Options
  /** Defaults to the builder's Part Number / description / Standard Range. */
  partNumber?: string
  description?: string
  standardRange?: StandardRange
  /** "10/18/2026" */
  drawnDate: string
  /** Storefront "/images/logo/cardinal-logo-ink.svg"; backend PDF render "cardinal-logo.svg". */
  logoHref: string
  /** "quote" (default) adds "CERTIFIED DRAWING ON QUOTE APPROVAL". */
  pricingMode?: PricingModeTag
  /** CDU kit only: the resolver's SKU per BOM line, shown in the BOM table. */
  resolvedSkus?: (string | null)[]
  print?: boolean
  className?: string
}

export function BuilderSheet({ builderType, options, partNumber, description, standardRange, ...rest }: BuilderSheetProps) {
  const b = getBuilder(builderType as string)
  const render = BUILDER_SHEETS[builderType] as (o: Options, p: Common) => ReactElement
  return render(options, {
    partNumber: partNumber ?? b.partNumber(options),
    description: description ?? b.describe(options),
    standardRange: standardRange ?? b.standardRange(options),
    ...rest,
  })
}
