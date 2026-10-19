// The data-center cut of the catalog (spec "Per-account pages"): 1"–4" tri-clamp ferrules, clamps,
// gaskets, 90° elbows and tees; 2"–4" ball and butterfly valves; 316L strainers. Shown at posted
// prices on a per-account page whose connection is not verified. Families are matched by SKU
// pattern (the same families as shared/cpq/dimensions/bom-templates.json), so only parts that
// really exist in the store are listed: "whatever exists". Pure; the fetch is in lib/data/catalog-cut.ts.

const S_1_4 = "(?:100|150|200|250|300|400|100-150)"
const S_2_4 = "(?:200|250|300|400)"

export type CutFamily = {
  key: string
  label: string
  /** Store search terms whose results are filtered by `sku`. */
  terms: string[]
  sku: RegExp
}

export const CATALOG_CUT_FAMILIES: readonly CutFamily[] = [
  { key: "ferrule", label: "Tri-clamp ferrules", terms: ["ferrule"], sku: new RegExp(`^14(?:AM7|WMP)[46]-${S_1_4}$`) },
  { key: "clamp", label: "Heavy-duty clamps", terms: ["clamp"], sku: new RegExp(`^13MHHM-${S_1_4}$`) },
  { key: "gasket", label: "Tri-clamp gaskets", terms: ["gasket"], sku: new RegExp(`^GTC(?:E|SW|T)-${S_1_4}$`) },
  { key: "elbow", label: "90° clamp elbows", terms: ["elbow"], sku: new RegExp(`^2CMP[46]-${S_1_4}$`) },
  { key: "tee", label: "Clamp tees", terms: ["tee"], sku: new RegExp(`^7MP[46]-${S_1_4}$`) },
  { key: "ball-valve", label: "Ball valves", terms: ["ball valve"], sku: new RegExp(`^TCBVS-${S_2_4}$`) },
  { key: "butterfly-valve", label: "Butterfly valves", terms: ["butterfly"], sku: new RegExp(`^TCBF[A-Z0-9]*-${S_2_4}$`) },
  { key: "strainer", label: "316L strainers", terms: ["strainer"], sku: /^(?:TCSTR|STR)[A-Z0-9]*-\d{3}$/ },
]

export type CutProduct = {
  handle?: string | null
  title?: string | null
  variants?:
    | {
        id?: string
        sku?: string | null
        title?: string | null
        calculated_price?: { calculated_amount?: number | string | null; currency_code?: string | null } | null
      }[]
    | null
}

export type CutRow = {
  sku: string
  title: string
  variantTitle: string | null
  handle: string | null
  /** Posted price, or null when the part has no price (quote only). */
  price: number | null
  currency: string
}

export type CutGroup = { key: string; label: string; rows: CutRow[] }

/** Groups the variants of the given products into the cut's families (deduplicated, SKU order). */
export function buildCatalogCut(products: readonly CutProduct[]): CutGroup[] {
  const seen = new Set<string>()
  const groups: CutGroup[] = CATALOG_CUT_FAMILIES.map((f) => ({ key: f.key, label: f.label, rows: [] }))
  for (const p of products) {
    for (const v of p.variants ?? []) {
      const sku = (v.sku ?? "").trim().toUpperCase()
      if (!sku || seen.has(sku)) continue
      const i = CATALOG_CUT_FAMILIES.findIndex((f) => f.sku.test(sku))
      if (i < 0) continue
      seen.add(sku)
      const raw = v.calculated_price?.calculated_amount
      const n = raw == null || raw === "" ? NaN : Number(raw)
      groups[i].rows.push({
        sku,
        title: p.title ?? sku,
        variantTitle: v.title && v.title !== "Default Variant" ? v.title : null,
        handle: p.handle ?? null,
        price: Number.isFinite(n) && n > 0 ? n : null,
        currency: v.calculated_price?.currency_code || "usd",
      })
    }
  }
  for (const g of groups) g.rows.sort((a, b) => a.sku.localeCompare(b.sku))
  return groups.filter((g) => g.rows.length > 0)
}

/** Every distinct search term of the cut. */
export function catalogCutTerms(): string[] {
  const out: string[] = []
  for (const f of CATALOG_CUT_FAMILIES) for (const t of f.terms) if (out.indexOf(t) < 0) out.push(t)
  return out
}
