// Inch parsing/formatting (ported unchanged from Sanitube shared/cpq/ts/units.ts).

const EPS = 1e-9

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * Parses an inch value. Accepts `12"`, `12`, `14-1/8"`, `14 1/8`, `14.125`, `1/2"`, and an optional
 * trailing `in`. Returns null for anything else (negative, NaN, garbage).
 */
export function parseInches(s: string): number | null {
  if (typeof s !== "string") return null
  let t = s.trim().toLowerCase()
  t = t.replace(/(″|"|''|in\.?|inch(es)?)$/, "").trim()
  if (t === "") return null

  // decimal: "14", "14.125", ".5"
  if (/^(\d+(\.\d*)?|\.\d+)$/.test(t)) {
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  // mixed fraction: "14-1/8", "14 1/8"
  let m = /^(\d+)\s*(?:-|\s)\s*(\d+)\s*\/\s*(\d+)$/.exec(t)
  if (m) {
    const den = Number(m[3])
    if (den === 0) return null
    return Number(m[1]) + Number(m[2]) / den
  }
  // bare fraction: "1/2"
  m = /^(\d+)\s*\/\s*(\d+)$/.exec(t)
  if (m) {
    const den = Number(m[2])
    if (den === 0) return null
    return Number(m[1]) / den
  }
  return null
}

/**
 * Formats inches the way fitting-spec option values are written: whole → `12"`,
 * eighths → `14-1/8"`, `14-1/4"`, `14-1/2"`, `1/2"`. Values off the 1/8" grid fall back to a
 * trimmed decimal (`14.1"`).
 */
export function formatInches(n: number): string {
  const eighths = Math.round(n * 8)
  if (Math.abs(n * 8 - eighths) > EPS) {
    return `${trimDecimal(n, 4)}"`
  }
  const neg = eighths < 0
  const abs = Math.abs(eighths)
  const whole = Math.floor(abs / 8)
  const rem = abs % 8
  let body: string
  if (rem === 0) body = `${whole}`
  else {
    const g = gcd(rem, 8)
    const frac = `${rem / g}/${8 / g}`
    body = whole === 0 ? frac : `${whole}-${frac}`
  }
  return `${neg ? "-" : ""}${body}"`
}

function trimDecimal(n: number, maxDecimals: number): string {
  let s = n.toFixed(maxDecimals)
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "")
  if (s === "-0") s = "0"
  return s
}

/**
 * Drawing-style dimension text: "4", "16", ".065", "18.85". At most 3 decimals, trailing zeros
 * trimmed, no leading zero before the decimal point.
 */
export function formatDim(n: number): string {
  let s = trimDecimal(n, 3)
  if (s.startsWith("0.")) s = s.slice(1)
  else if (s.startsWith("-0.")) s = "-" + s.slice(2)
  return s
}

/** Decimal inches with trailing zeros trimmed (Share Link `clr`): 12 → "12", 14.125 → "14.125". */
export function formatDecimalInches(n: number): string {
  return trimDecimal(n, 4)
}

/** True when n sits on the 1/8" grid. */
export function isEighth(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n * 8 - Math.round(n * 8)) < 1e-6
}

/** Size token in Phase 4 Part Numbers and catalog SKUs (D13): 50 → "050", 200 → "200", 1200 → "1200". */
export function sizeToken(code: number): string {
  return String(code).padStart(3, "0")
}

/** Decimal-point token for Part Numbers (sweep CLR rule): 12 → "12", 36.125 → "36p125". */
export function pnNumberToken(n: number): string {
  let s = n.toFixed(4)
  s = s.replace(/0+$/, "").replace(/\.$/, "")
  return s.replace(".", "p")
}

// ---------------------------------------------------------------- weights
// A weight is rounded ONCE, to 0.1 lb, and every total is that rounded per-unit weight × units,
// so the page, the resolve response and the drawing agree (a pair is exactly 2 × one manifold).

/** Per-unit weight rounded to 0.1 lb. */
export function roundLb(lb: number): number {
  return Math.round((lb + Number.EPSILON) * 10) / 10
}

/** Total weight: the rounded per-unit weight × units (float noise removed). */
export function totalLb(perUnitLb: number, units: number): number {
  return Math.round(roundLb(perUnitLb) * units * 10) / 10
}

/** "88.6", "1,234.5": one decimal, thousands separated. */
export function formatLb(lb: number): string {
  const [int, dec] = roundLb(lb).toFixed(1).split(".")
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}
