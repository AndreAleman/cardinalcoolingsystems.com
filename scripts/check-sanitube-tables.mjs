#!/usr/bin/env node
// Plan B10: Cardinal's shared/cpq tables must agree with Sanitube's on every row both sites have, so
// the two never disagree on a 2" TC ferrule. Compares, against a sibling sanitube.us checkout:
//   tube-sizes.json       every Sanitube size row (all fields)
//   materials.json        every alloy row (all fields)
//   end-connections.json  every Sanitube type and row (all fields except Cardinal's added mass_lb)
//
//   node scripts/check-sanitube-tables.mjs [path/to/sanitube.us]
//
// The checkout is looked up as the argument, $SANITUBE_DIR, ../sanitube.us or ../../sanitube.us
// (from a worktree). No checkout → prints a notice and exits 0 (it is optional on CI).
// Exit 1 on any difference. Plain Node >= 20, no dependencies.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const candidates = [process.argv[2], process.env.SANITUBE_DIR, "../sanitube.us", "../../sanitube.us", "../../../sanitube.us"]
  .filter(Boolean)
  .map((p) => path.resolve(ROOT, p))
const sanitube = candidates.find((p) => fs.existsSync(path.join(p, "shared/cpq/dimensions/tube-sizes.json")))
if (!sanitube) {
  console.log("check-sanitube-tables: no sanitube.us checkout found; skipped")
  process.exit(0)
}

const read = (root, f) => JSON.parse(fs.readFileSync(path.join(root, "shared/cpq/dimensions", f), "utf8"))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const strip = (row, drop) => Object.fromEntries(Object.entries(row).filter(([k]) => !drop.includes(k)).sort(([x], [y]) => x.localeCompare(y)))
const problems = []

function compareRows(file, key, sRows, cRows, keyOf, drop = []) {
  for (const s of sRows) {
    const c = cRows.find((r) => keyOf(r) === keyOf(s))
    if (!c) problems.push(`${file} ${key}: missing ${keyOf(s)}`)
    else if (!same(strip(s, drop), strip(c, drop))) problems.push(`${file} ${key}: ${keyOf(s)} differs`)
  }
}

const sTube = read(sanitube, "tube-sizes.json")
const cTube = read(ROOT, "tube-sizes.json")
compareRows("tube-sizes.json", "sizes", sTube.sizes, cTube.sizes, (r) => String(r.size_code))

const sMat = read(sanitube, "materials.json")
const cMat = read(ROOT, "materials.json")
compareRows("materials.json", "alloys", sMat.alloys, cMat.alloys, (r) => r.value)

const sEnd = read(sanitube, "end-connections.json")
const cEnd = read(ROOT, "end-connections.json")
compareRows("end-connections.json", "types", sEnd.types, cEnd.types, (r) => r.code)
compareRows("end-connections.json", "rows", sEnd.rows, cEnd.rows, (r) => `${r.code}×${r.size_code}`, ["mass_lb"])

if (problems.length) {
  console.error(`check-sanitube-tables: ${problems.length} difference(s) vs ${sanitube}`)
  for (const p of problems) console.error("  " + p)
  process.exit(1)
}
console.log(
  `check-sanitube-tables: in agreement with ${sanitube} (${sTube.sizes.length} sizes, ${sMat.alloys.length} alloys, ${sEnd.rows.length} end rows)`,
)
