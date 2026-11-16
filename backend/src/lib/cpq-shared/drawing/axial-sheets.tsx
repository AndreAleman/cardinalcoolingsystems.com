// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Engineering View sheets for the axial parts: Transition Spool, Strainer, Hose Assembly. Each maps
// its geometry to an AxialPartInput (axial-layout.ts) and draws the shared AxialPartView inside the
// Cardinal sheet chrome. Plain SVG, no hooks.

import { formatDim } from "../units"
import type { HoseGeometry, StrainerGeometry, TransitionGeometry } from "../types"
import { Dimension, DimLabel } from "./dimension"
import { layoutAxial, type AxialLayout, type AxialPartInput } from "./axial-layout"
import { Line, PART, SheetChrome, THIN, type SheetProps } from "./sheet-chrome"
import { reviewStampBox } from "./layout"

export function AxialPartView({ l, kind }: { l: AxialLayout; kind: string }) {
  return (
    <g data-part={kind}>
      <g stroke={THIN} strokeWidth={0.8} strokeDasharray="14 4 2 4" fill="none">
        {l.centerlines.map(([a, b], i) => (
          <Line key={i} a={a} b={b} />
        ))}
      </g>
      <g fill="none" stroke={PART} strokeWidth={0.8} strokeDasharray="5 3">
        {l.innerPaths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke={PART} strokeWidth={1.6} strokeLinejoin="round">
        {l.outerPaths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {l.faceLines.map(([a, b], i) => (
          <Line key={i} a={a} b={b} />
        ))}
      </g>
      {l.braidPaths.length > 0 ? (
        <g data-braid="" fill="none" stroke={THIN} strokeWidth={0.6}>
          {l.braidPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
      {l.hosePaths.length > 0 ? (
        <g fill="none" stroke={PART} strokeWidth={1.6}>
          {l.hosePaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
      {l.bodyPaths.map((d, i) => (
        <path key={`b${i}`} d={d} fill="#ffffff" stroke={PART} strokeWidth={1.6} strokeLinejoin="round" />
      ))}
      {l.breakPaths.length > 0 ? (
        <g data-break="" fill="none" stroke={PART} strokeWidth={1.1} strokeLinejoin="round">
          {l.breakPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
      {l.endOutlines.map((e, i) => (
        <g key={`e${i}`}>
          <path d={e.d} fill="#ffffff" stroke={PART} strokeWidth={1.6} strokeLinejoin="round" />
          {e.weld ? <Line a={e.weld[0]} b={e.weld[1]} stroke={PART} strokeWidth={0.8} /> : null}
        </g>
      ))}
      {l.dims.map((d) => (
        <Dimension key={d.id} dim={d} />
      ))}
      {l.endTags.map((t, i) => (
        <DimLabel key={i} t={t} color={PART} size={13} />
      ))}
    </g>
  )
}

function AxialSheet({
  input,
  kind,
  weightLb,
  extraNotes,
  props,
}: {
  input: AxialPartInput
  kind: string
  weightLb: number
  extraNotes?: string[]
  props: Omit<SheetProps<unknown>, "geometry">
}) {
  const { partNumber, description, drawnDate, logoHref, standardRange, pricingMode, print, className } = props
  const reasons = standardRange.ok ? [] : standardRange.reasons.map((r) => r.message)
  const l = layoutAxial(input, reasons.length ? [reviewStampBox(reasons)] : [])
  return (
    <SheetChrome
      titleBlock={{ partNumber, description, drawnDate, weightLb, logoHref }}
      reviewReasons={reasons.length ? reasons : null}
      notes={[...l.notes, ...(extraNotes ?? [])]}
      pricingMode={pricingMode}
      print={print}
      className={className}
    >
      <AxialPartView l={l} kind={kind} />
    </SheetChrome>
  )
}

/** Transition Spool: End A, tube, concentric reducer when reducing, End B. */
export function transitionAxialInput(g: TransitionGeometry): AxialPartInput {
  return {
    length: g.overallLength,
    ends: g.ends,
    odA: g.od,
    odB: g.odb,
    segments: g.segments,
    endDims: true,
    wall: g.wall,
    extraDims: g.reducer ? [{ id: "reducer", x0: g.reducer.x0, x1: g.reducer.x1, label: formatDim(g.reducer.length) }] : [],
  }
}

export type TransitionSheetProps = SheetProps<TransitionGeometry>

export function TransitionSheet({ geometry, ...props }: TransitionSheetProps) {
  const notes = geometry.reducer ? ["CONCENTRIC REDUCER PER ASME B16.9 (APPROX.)"] : []
  if (geometry.ends.b.code === "fl150" || geometry.ends.b.code === "fl300") notes.push("FLANGE BOLT HOLES NOT SHOWN")
  return (
    <AxialSheet
      input={transitionAxialInput(geometry)}
      kind="transition"
      weightLb={geometry.approxWeightLb}
      extraNotes={notes}
      props={props}
    />
  )
}

/** Strainer: TC ends, necks, cones, body (body length dimensioned). */
export function strainerAxialInput(g: StrainerGeometry): AxialPartInput {
  const body = g.segments.filter((s) => s.style !== "tube")
  return {
    length: g.overallLength,
    ends: g.ends,
    odA: g.od,
    odB: g.od,
    segments: g.segments,
    extraDims: body.length ? [{ id: "body", x0: body[0].x0, x1: body[body.length - 1].x1, label: formatDim(g.bodyLength) }] : [],
  }
}

export type StrainerSheetProps = SheetProps<StrainerGeometry>

export function StrainerSheet({ geometry, ...props }: StrainerSheetProps) {
  return (
    <AxialSheet
      input={strainerAxialInput(geometry)}
      kind="strainer"
      weightLb={geometry.approxWeightLb}
      extraNotes={[`BODY Ø${formatDim(geometry.bodyOd)}, SCREEN ${geometry.meshMicron} µm`, "ENVELOPE APPROXIMATE"]}
      props={props}
    />
  )
}

/** Hose Assembly: end fittings, collars, braided hose. */
export function hoseAxialInput(g: HoseGeometry): AxialPartInput {
  return { length: g.length, ends: g.ends, odA: g.od, odB: g.od, segments: g.segments, odNoun: "HOSE" }
}

export type HoseSheetProps = SheetProps<HoseGeometry>

export function HoseSheet({ geometry, ...props }: HoseSheetProps) {
  return (
    <AxialSheet
      input={hoseAxialInput(geometry)}
      kind="hose"
      weightLb={geometry.approxWeightLb}
      extraNotes={[`WORKING PRESSURE ${geometry.ratedPsi} PSI, MIN BEND R ${formatDim(geometry.minBendRadius)}`]}
      props={props}
    />
  )
}
