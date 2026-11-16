// Standard Range checks: review flags, not hard limits. A configuration outside the Standard Range
// is still quotable; it is flagged for engineering review (Sanitube convention), and the drawing
// carries the ENGINEERING REVIEW stamp.

import { formatDim, formatInches } from "./units"
import { ASSEMBLIES, endConnectionType, tubeDims, valveRow } from "./tables"
import type {
  CduKitOptions,
  HoseGeometry,
  HoseOptions,
  ManifoldBranch,
  ManifoldGeometry,
  ReviewReason,
  RowManifoldOptions,
  StandardRange,
  TransitionGeometry,
  TransitionOptions,
} from "./types"

export function okRange(): StandardRange {
  return { ok: true, reasons: [] }
}

function result(reasons: ReviewReason[]): StandardRange {
  return { ok: reasons.length === 0, reasons }
}

/** Transition: ends (and the reducer) longer than the Overall Length allows. */
export function checkTransitionRange(o: TransitionOptions, g: TransitionGeometry): StandardRange {
  const reasons: ReviewReason[] = []
  if (g.tubeStraight < -1e-9) {
    const what = g.reducer ? `ends and the ${formatDim(g.reducer.length)}" reducer` : "ends"
    reasons.push({
      code: "ends_overlap",
      message: `${endConnectionType(o.a).short} and ${endConnectionType(o.b).short} ${what} are longer than the ${formatInches(
        o.len,
      )} Overall Length (engineering review)`,
    })
  }
  return result(reasons)
}

/** Clear gap between two branches on the same side of the header (envelopes, in). */
function branchGap(p: ManifoldBranch, q: ManifoldBranch): number {
  const rp = Math.max(p.od, p.end.maxOd) / 2
  const rq = Math.max(q.od, q.end.maxOd) / 2
  return Math.abs(q.x - p.x) - rp - rq
}

/**
 * Manifold: header longer than one 20 ft stick (welded header joint), drops too close for the
 * ferrules or valves, drop stubs with no tube left, ports crowding each other or a drop.
 */
export function checkManifoldRange(o: RowManifoldOptions, g: ManifoldGeometry): StandardRange {
  const reasons: ReviewReason[] = []
  const stick = ASSEMBLIES.stick_length_in
  if (g.header.tubeLength > stick + 1e-9) {
    reasons.push({
      code: "header_over_stick",
      message: `Header tube ${formatDim(g.header.tubeLength)}" is longer than one ${formatDim(stick / 12)} ft stick: welded header joint (engineering review)`,
    })
  }
  const drop = tubeDims(o.drop)
  const dropEnd = g.branches.find((b) => b.role === "drop")
  const valve = o.dstyle === "bv" ? valveRow("bv", o.drop) : null
  // A drop ball valve's handle swings about 1.5 × the valve body length (draft).
  const envelope = Math.max(drop.od, dropEnd ? dropEnd.end.maxOd : 0, valve ? valve.length_in * 1.5 : 0)
  const minPitch = envelope + ASSEMBLIES.manifold.min_pitch_clearance_in
  if (o.pitch < minPitch - 1e-9) {
    reasons.push({
      code: "pitch_tight",
      message: `${formatInches(o.pitch)} pitch leaves under ${formatDim(ASSEMBLIES.manifold.min_pitch_clearance_in)}" between drop ${valve ? "valves" : "ferrules"} (engineering review)`,
    })
  }
  if (dropEnd && dropEnd.stubLength < 0.5 - 1e-9) {
    reasons.push({ code: "drop_stub_short", message: "Drop End Connection leaves under 1/2\" of stub tube (engineering review)" })
  }
  let crowded = false
  for (const side of [1, -1] as const) {
    const bs = g.branches.filter((b) => b.side === side).sort((p, q) => p.x - q.x)
    for (let i = 0; i + 1 < bs.length; i++) {
      if (bs[i].role === "drop" && bs[i + 1].role === "drop") continue
      if (branchGap(bs[i], bs[i + 1]) < 0.25) crowded = true
    }
  }
  if (crowded) {
    reasons.push({
      code: "ports_crowded",
      message: "Fill, vent or instrument ports crowd a drop or each other within the end allowance (engineering review)",
    })
  }
  const drops = g.branches.filter((b) => b.role === "drop")
  if (drops.length) {
    const r = Math.max(drop.od, drops[0].end.maxOd) / 2
    const a = g.header.ends.a
    const b = g.header.ends.b
    const hit = a.length > drops[0].x - r ? a : g.header.length - b.length < drops[drops.length - 1].x + r ? b : null
    if (hit) {
      reasons.push({ code: "end_reaches_drop", message: `${endConnectionType(hit.code).short} header end reaches the nearest drop (engineering review)` })
    }
  }
  return result(reasons)
}

/** CDU kit: a hygienic flange port needs its flange standard confirmed. */
export function checkKitRange(o: CduKitOptions): StandardRange {
  const reasons: ReviewReason[] = []
  if (o.port === "dn50" || o.port === "dn80") {
    reasons.push({
      code: "dn_port_confirm",
      message: "Hygienic flange CDU port: confirm the flange standard (DIN 11853-2 or ISO 2852) before quoting",
    })
  }
  return result(reasons)
}

/** Hose: an assembly shorter than its ends and collars leave room for. */
export function checkHoseRange(o: HoseOptions, g: HoseGeometry): StandardRange {
  const reasons: ReviewReason[] = []
  const hose = g.segments.find((s) => s.style === "hose")
  if (!hose || hose.x1 - hose.x0 < 2 - 1e-9) {
    reasons.push({ code: "hose_too_short", message: `${formatInches(o.len)} leaves under 2" of live hose between the fittings (engineering review)` })
  }
  return result(reasons)
}

/**
 * Standard Range flags that do NOT stop a CAD Package: the geometry is sound, the drawing carries
 * the ENGINEERING REVIEW stamp, and staff review every package anyway (plan B7). A manifold longer
 * than one 20 ft stick (every 48-drop manifold) needs a welded header joint, not a different
 * model; a DN hygienic-flange port size needs confirming, not redrawing. Shared so the storefront's
 * CAD panel and POST /store/cad-requests refuse exactly the same configurations.
 */
export const CAD_ADVISORY_RANGE_CODES: readonly string[] = ["header_over_stick", "dn_port_confirm"]

/** The Standard Range reasons that refuse CAD files (geometry that may not model or mislead). */
export function cadBlockingRangeReasons(range: StandardRange): ReviewReason[] {
  return range.reasons.filter((r) => !CAD_ADVISORY_RANGE_CODES.includes(r.code))
}
