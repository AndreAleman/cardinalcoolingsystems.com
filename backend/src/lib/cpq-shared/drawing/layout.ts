// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Sheet geometry shared by every Engineering View sheet (ported from Sanitube layout.ts: the sheet,
// frame, title block and logo strip boxes, and the text-fitting helpers; the sweep layout itself is
// not ported). No React, no DOM.

import type { Vec2 } from "../types"
import { DIM_STYLE, type Box } from "./dimension-layout"

export const SHEET = { w: 1000, h: 640, border: 14 } as const
export const TITLE_BLOCK = { w: 500, h: 150 } as const
/** Logo + reference note strip directly above the title block. */
export const STRIP_H = 58

export type EndOutline = { d: string; poly: Vec2[]; weld: [Vec2, Vec2] | null }

/** The sheet frame (inside the border). */
export function frameBox(): Box {
  const b = SHEET.border
  return { x: b, y: b, w: SHEET.w - 2 * b, h: SHEET.h - 2 * b }
}
/** The title block, bottom right of the frame. */
export function titleBox(): Box {
  const b = SHEET.border
  return { x: SHEET.w - b - TITLE_BLOCK.w, y: SHEET.h - b - TITLE_BLOCK.h, w: TITLE_BLOCK.w, h: TITLE_BLOCK.h }
}
/** Logo + notes strip directly above the title block. */
export function stripBox(): Box {
  const t = titleBox()
  return { x: t.x, y: t.y - STRIP_H, w: t.w, h: STRIP_H }
}

// ---------- title block text helpers ----------

/** Greedy word wrap to at most `maxLines` lines of ≤ maxChars (last line may overflow). */
export function wrapText(text: string, maxChars: number, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    if (lines.length === maxLines - 1) {
      cur = cur ? `${cur} ${w}` : w
      continue
    }
    if (!cur) cur = w
    else if (cur.length + 1 + w.length <= maxChars) cur = `${cur} ${w}`
    else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

/** Largest font size ≤ max that fits `text` into `width` px (Arial-like metrics). */
export function fitFontSize(text: string, width: number, max: number, min = 9): number {
  const w = text.length * DIM_STYLE.charW
  if (w === 0) return max
  return Math.max(min, Math.min(max, Math.floor((width / w) * 10) / 10))
}

// ---------- ENGINEERING REVIEW stamp ----------

/** Top-left corner of the ENGINEERING REVIEW stamp (top right of the frame). */
export function stampOrigin(): Vec2 {
  const f = frameBox()
  return [f.x + f.w - 300, f.y + 14]
}

/** Area the stamp and its right-aligned reason lines cover, so a part view can stay clear of it. */
export function reviewStampBox(reasons: string[]): Box {
  const [x, y] = stampOrigin()
  const widest = reasons.reduce((w, r) => Math.max(w, r.length * 11.5 * DIM_STYLE.charW), 0)
  const left = Math.min(x - 8, x + 280 - widest - 6)
  return { x: left, y: y - 22, w: x + 300 - left, h: 72 + 14 * reasons.length + 8 }
}
