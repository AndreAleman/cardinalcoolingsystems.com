#!/usr/bin/env node
// Builds backend/src/scripts/data/builder-seed-catalog.json from a read-only dump of the live store
// catalog, keeping only the variants the Cardinal Builder's BOM templates can name
// (shared/cpq/dimensions/bom-templates.json). Other streams seed a local DB and write tests from it.
//
//   node scripts/builder-seed-catalog.mjs <catalog-dump.json> [--report]
//
// The dump is the `products` array of GET /store/products?fields=id,title,handle,*variants,
// +variants.weight,+variants.inventory_quantity,+variants.manage_inventory,*variants.options,
// *variants.calculated_price&region_id=<US region> (all pages), taken with the publishable key only.
// --report prints, per role and size, which candidate resolves (B1: price > 0, weight, stock > 0).
//
// Plain Node >= 20, no dependencies.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TEMPLATES = JSON.parse(fs.readFileSync(path.join(ROOT, "shared/cpq/dimensions/bom-templates.json"), "utf8"))
const OUT = path.join(ROOT, "backend/src/scripts/data/builder-seed-catalog.json")

const [dumpPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"))
if (!dumpPath) {
  console.error("usage: node scripts/builder-seed-catalog.mjs <catalog-dump.json> [--report]")
  process.exit(2)
}
const products = JSON.parse(fs.readFileSync(dumpPath, "utf8"))

// Pattern → regex over any size/alloy.
const toRegex = (p) =>
  new RegExp(
    "^" +
      p
        .replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === "{" || c === "}" ? c : "\\" + c))
        .replace("{d}", "[46]")
        .replace("{sr}", "\\d{3}-\\d{3}")
        .replace("{s}{s2}", "\\d{6,8}")
        .replace("{s}", "\\d{3,4}") +
      "$",
  )
const regexes = TEMPLATES.roles.flatMap((r) => r.patterns.map((p) => ({ role: r.role, re: toRegex(p) })))

const variants = []
for (const p of products) {
  for (const v of p.variants ?? []) {
    const sku = v.sku ?? ""
    const roles = regexes.filter((x) => x.re.test(sku)).map((x) => x.role)
    if (!roles.length) continue
    const price = v.calculated_price?.calculated_amount
    variants.push({
      sku,
      product_title: p.title,
      handle: p.handle,
      options: (v.options ?? []).map((o) => o.value),
      price: typeof price === "number" ? price : null,
      weight: v.weight ?? null,
      inventory_quantity: v.inventory_quantity ?? null,
      manage_inventory: v.manage_inventory ?? null,
      roles: [...new Set(roles)].sort(),
    })
  }
}
variants.sort((a, b) => a.sku.localeCompare(b.sku))

const out = {
  source: "GET https://backend-production-04a8.up.railway.app/store/products (US region, publishable key, read-only)",
  taken_at: "2026-10-18",
  notes: [
    "Prices are the region's calculated_amount in dollars (list price, no customer auth).",
    "Only variants matching a bom-templates.json pattern; written by scripts/builder-seed-catalog.mjs.",
    "B1: a line resolves Instant only when price > 0, weight is set and stock covers the quantity.",
  ],
  variants,
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
// One variant per line keeps the fixture small and diffable.
const head = JSON.stringify({ ...out, variants: [] }, null, 2).replace(/"variants": \[\]\n\}$/, "")
fs.writeFileSync(OUT, `${head}"variants": [\n${variants.map((v) => "    " + JSON.stringify(v)).join(",\n")}\n  ]\n}\n`)
console.log(`builder-seed-catalog.json: ${variants.length} variants`)

if (process.argv.includes("--report")) {
  const bySku = new Map(variants.map((v) => [v.sku, v]))
  const sizes = [50, 75, 100, 150, 200, 250, 300, 400, 600, 800]
  const pad = (n) => String(n).padStart(3, "0")
  for (const r of TEMPLATES.roles) {
    const rows = []
    const digits = r.patterns.some((p) => p.includes("{d}")) ? ["6", "4"] : ["-"]
    for (const d of digits) {
      for (const s of sizes) {
        const cands = []
        for (const p of r.patterns) {
          if (p.includes("{s2}")) continue
          let c = p.replace("{d}", d).replace("{s}", pad(s))
          if (c.includes("{sr}")) {
            const range = TEMPLATES.size_ranges[pad(s)]
            if (!range) continue
            c = c.replace("{sr}", range)
          }
          if (!cands.includes(c)) cands.push(c)
        }
        const hit = cands.map((c) => bySku.get(c)).find((v) => v)
        const priced = hit && hit.price > 0
        const weighed = hit && hit.weight > 0
        const stocked = hit && (hit.manage_inventory === false || hit.inventory_quantity > 0)
        const flags = hit ? [priced ? "" : "$0", weighed ? "" : "no-wt", stocked ? "" : "no-stock"].filter((x) => x) : []
        rows.push(`${d}/${pad(s)}:${hit ? hit.sku + (flags.length ? `(${flags.join(",")})` : "") : "-"}`)
      }
    }
    console.log(`\n${r.role}: ${r.patterns.join(", ") || "(none stocked)"}\n  ${rows.join("  ")}`)
  }
}
