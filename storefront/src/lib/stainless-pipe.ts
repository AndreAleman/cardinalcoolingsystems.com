import { HttpTypes } from "@medusajs/types"

/*
  Stainless schedule pipe (ASTM A312 welded) on the stainless tubing &
  pipe landing page. The product is created by
  backend/src/scripts/import-stainless-pipe.ts from SaniTube's QuickBooks
  pipe items; it is Quote-Only ($0 + requires_quote), so it never reaches
  the paid cart.

  Pipe is sized by NPS and schedule (ASME B36.19), not by actual OD like
  sanitary tube, so OD and wall come from the standard below rather than
  from the variant options.
*/

export const STAINLESS_PIPE_PRODUCT_HANDLE = "stainless-steel-pipe-a312-welded"

/* ASME B36.19 stainless pipe: NPS -> OD and wall (inches) per schedule. */
const PIPE_STANDARD: Record<string, { od: number; walls: Record<string, number> }> = {
  '1/4"': { od: 0.54, walls: { "10S": 0.065, "40S": 0.088, "80S": 0.119 } },
  '3/8"': { od: 0.675, walls: { "10S": 0.065, "40S": 0.091, "80S": 0.126 } },
  '1/2"': { od: 0.84, walls: { "5S": 0.065, "10S": 0.083, "40S": 0.109, "80S": 0.147 } },
  '3/4"': { od: 1.05, walls: { "5S": 0.065, "10S": 0.083, "40S": 0.113, "80S": 0.154 } },
  '1"': { od: 1.315, walls: { "5S": 0.065, "10S": 0.109, "40S": 0.133, "80S": 0.179 } },
  '1-1/4"': { od: 1.66, walls: { "5S": 0.065, "10S": 0.109, "40S": 0.14, "80S": 0.191 } },
  '1-1/2"': { od: 1.9, walls: { "5S": 0.065, "10S": 0.109, "40S": 0.145, "80S": 0.2 } },
  '2"': { od: 2.375, walls: { "5S": 0.065, "10S": 0.109, "40S": 0.154, "80S": 0.218 } },
  '2-1/2"': { od: 2.875, walls: { "5S": 0.083, "10S": 0.12, "40S": 0.203, "80S": 0.276 } },
  '3"': { od: 3.5, walls: { "5S": 0.083, "10S": 0.12, "40S": 0.216, "80S": 0.3 } },
  '4"': { od: 4.5, walls: { "5S": 0.083, "10S": 0.12, "40S": 0.237, "80S": 0.337 } },
  '5"': { od: 5.563, walls: { "5S": 0.109, "10S": 0.134, "40S": 0.258, "80S": 0.375 } },
  '6"': { od: 6.625, walls: { "5S": 0.109, "10S": 0.134, "40S": 0.28, "80S": 0.432 } },
  '8"': { od: 8.625, walls: { "5S": 0.109, "10S": 0.148, "40S": 0.322, "80S": 0.5 } },
  '10"': { od: 10.75, walls: { "5S": 0.134, "10S": 0.165, "40S": 0.365, "80S": 0.5 } },
  '12"': { od: 12.75, walls: { "5S": 0.156, "10S": 0.18, "40S": 0.375, "80S": 0.5 } },
  '14"': { od: 14, walls: { "5S": 0.156, "10S": 0.188 } },
}

const SCHEDULE_ORDER = ["5S", "10S", "40S", "80S"]

/* 0.065 -> 0.065" ; 0.54 -> 0.540" */
function inches(n: number): string {
  return `${n.toFixed(3)}"`
}

/* Parses 1-1/2", 2", 3/8" into inches, for sorting. */
function parseNps(value: string): number {
  const clean = value.replace(/["″]/g, "").trim()
  const mixed = clean.match(/^(\d+)-(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = clean.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

/* "Sch 10S" -> "10S" */
export function normalizeSchedule(value: string): string {
  return value.replace(/^sch(edule)?\.?\s*/i, "").trim().toUpperCase()
}

export type PipeVariantOption = {
  sku: string
  finish: string
  alloy: string
  /* e.g. 10S */
  schedule: string
  /* NPS, e.g. 1-1/2" */
  size: string
}

export type PipeColumn = { key: string; label: string }

export type PipeSizeRow = {
  size: string
  sizeInches: number
  schedule: string
  od: string | null
  wall: string | null
  /* column key -> SKU */
  skus: Record<string, string>
}

function optionValue(
  variant: HttpTypes.StoreProductVariant,
  match: (title: string) => boolean
): string | null {
  const opt = (variant.options ?? []).find((o: any) =>
    match(String(o?.option?.title ?? "").toLowerCase())
  )
  return opt?.value ? String(opt.value) : null
}

export function pipeVariantOptions(
  product: HttpTypes.StoreProduct | null | undefined
): PipeVariantOption[] {
  const out: PipeVariantOption[] = []
  for (const v of product?.variants ?? []) {
    if (!v.sku) continue
    const finish = optionValue(v, (t) => t.includes("finish"))
    const alloy = optionValue(v, (t) => t.includes("alloy") || t.includes("material"))
    const schedule = optionValue(v, (t) => t.includes("schedule"))
    const size = optionValue(v, (t) => t.includes("size") || t.includes("nps"))
    if (!finish || !alloy || !schedule || !size) continue
    out.push({
      sku: v.sku,
      finish,
      alloy: alloy.trim().replace(/^T(?=\d)/i, ""),
      schedule: normalizeSchedule(schedule),
      size,
    })
  }
  return out
}

/* Polished columns after mill finish, 304 before 316. */
function columnKey(o: PipeVariantOption): string {
  return `${o.alloy} ${o.finish.toLowerCase()}`
}

export function pipeSizeRows(options: PipeVariantOption[]): {
  rows: PipeSizeRow[]
  columns: PipeColumn[]
} {
  const byKey = new Map<string, PipeSizeRow>()
  const columns = new Map<string, PipeColumn & { sort: string }>()
  for (const o of options) {
    const key = columnKey(o)
    const polished = /polish/i.test(o.finish) ? 1 : 0
    /* "304 mill finish", "316 polished OD" */
    const label = `${o.alloy} ${polished ? o.finish.replace(/^polished/i, "polished") : o.finish.toLowerCase()}`
    columns.set(key, { key, label, sort: `${polished}-${o.alloy}` })
    const rowKey = `${o.size}|${o.schedule}`
    const std = PIPE_STANDARD[o.size]
    const wall = std?.walls[o.schedule]
    const row =
      byKey.get(rowKey) ??
      ({
        size: o.size,
        sizeInches: parseNps(o.size),
        schedule: o.schedule,
        od: std ? inches(std.od) : null,
        wall: wall ? inches(wall) : null,
        skus: {},
      } as PipeSizeRow)
    row.skus[key] = o.sku
    byKey.set(rowKey, row)
  }
  const rows = Array.from(byKey.values()).sort(
    (a, b) =>
      a.sizeInches - b.sizeInches ||
      SCHEDULE_ORDER.indexOf(a.schedule) - SCHEDULE_ORDER.indexOf(b.schedule)
  )
  const cols = Array.from(columns.values())
    .sort((a, b) => a.sort.localeCompare(b.sort))
    .map(({ key, label }) => ({ key, label }))
  return { rows, columns: cols }
}

export function pipeSchedules(options: PipeVariantOption[]): string[] {
  return Array.from(new Set(options.map((o) => o.schedule))).sort(
    (a, b) => SCHEDULE_ORDER.indexOf(a) - SCHEDULE_ORDER.indexOf(b)
  )
}
