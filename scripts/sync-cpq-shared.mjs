#!/usr/bin/env node
// Sync the canonical shared CPQ core (shared/cpq) into each consumer (Cardinal Builder plan B10;
// ported from sanitube.us scripts/sync-cpq-shared.mjs).
//
//   node scripts/sync-cpq-shared.mjs          write the generated copies
//   node scripts/sync-cpq-shared.mjs --check  exit 1 if a committed copy differs (drift guard)
//
// Targets (committed, GENERATED):
//   storefront/src/lib/cpq/shared/      TS
//   backend/src/lib/cpq-shared/         TS
//   cad-service/cpq_shared/             JSON/assets only (Python cad-service)
// Each TS target gets every shared/cpq/ts/*.ts plus shared/cpq/ts/drawing/*.{ts,tsx} (under
// drawing/) with a GENERATED header, plus dimension-tables.ts, which inlines
// shared/cpq/dimensions/*.json as typed consts and exports CPQ_TABLES_HASH.
// The cad-service target gets byte-for-byte copies of dimensions/*.json, every
// fixtures/*-golden.json (transition / manifold vectors: input options + the `expected` geometry)
// and fixtures/*-golden.svg (the backend's React 18 renders of the golden vectors, for the PDF
// tests), and assets/cardinal-logo.svg, plus MANIFEST.json (sha256 per file and the tables hash).
// cad-service/ itself is created by the CAD stream; this script only writes cpq_shared/ in it.
// The canonical folder also gets its own dimension-tables.ts (git-ignored) so it type-checks
// standalone; --check ignores that one.
//
// CPQ_TABLES_HASH (Sanitube Phase 3 D5): first 12 hex chars of sha256 over the raw bytes of
// shared/cpq/dimensions/*.json, sorted by file name, each fed as `${name}\0${bytes}\0`.
//
// Plain Node >= 20, no dependencies.

import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHARED = path.join(ROOT, "shared/cpq")
const SRC_TS = path.join(SHARED, "ts")
const SRC_DIM = path.join(SHARED, "dimensions")
const TS_TARGETS = ["storefront/src/lib/cpq/shared", "backend/src/lib/cpq-shared"]
const CAD_TARGET = "cad-service/cpq_shared"
const TS_SUBDIRS = ["drawing"]
const CANONICAL_TABLES = path.join(SRC_TS, "dimension-tables.ts")

const HEADER =
  "// GENERATED from shared/cpq. Do not edit.\n" +
  "// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs\n"

// JSON file → [export name, type name]
const TABLES = [
  ["tube-sizes.json", "TUBE_SIZES_TABLE", "TubeSizesTable"],
  ["end-connections.json", "END_CONNECTIONS_TABLE", "EndConnectionsTable"],
  ["materials.json", "MATERIALS_TABLE", "MaterialsTable"],
  ["bom-templates.json", "BOM_TEMPLATES_TABLE", "BomTemplatesTable"],
  ["assemblies.json", "ASSEMBLIES_TABLE", "AssembliesTable"],
]
const LOGO = "assets/cardinal-logo.svg"
// The ink (#0a0a0a) logo, served by the storefront for the on-page drawing (the site header's
// /images/logo/new-cardinal-cooling-logo.svg is white and vanishes on the white sheet).
const STOREFRONT_LOGO = "storefront/public/images/logo/cardinal-logo-ink.svg"

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex")

function dimensionFiles() {
  return fs
    .readdirSync(SRC_DIM)
    .filter((f) => f.endsWith(".json"))
    .sort()
}

export function tablesHash() {
  const h = crypto.createHash("sha256")
  for (const f of dimensionFiles()) {
    h.update(Buffer.from(f + "\0", "utf8"))
    h.update(fs.readFileSync(path.join(SRC_DIM, f)))
    h.update(Buffer.from("\0", "utf8"))
  }
  return h.digest("hex").slice(0, 12)
}

/** Every fixtures/*-golden.json and fixtures/*-golden.svg (geometry vectors and sheet goldens). */
function goldenFixtureFiles() {
  return fs
    .readdirSync(path.join(SHARED, "fixtures"))
    .filter((f) => /-golden\.(json|svg)$/.test(f))
    .sort()
}

function buildDimensionTables(hash) {
  const types = TABLES.map((t) => t[2]).join(", ")
  let out = `import type { ${types} } from "./types"\n`
  out +=
    `\n// Version of shared/cpq/dimensions/*.json: part of the CAD Package cache key.\n` +
    `export const CPQ_TABLES_HASH = ${JSON.stringify(hash)}\n`
  for (const [file, name, type] of TABLES) {
    const json = JSON.parse(fs.readFileSync(path.join(SRC_DIM, file), "utf8"))
    out += `\n// shared/cpq/dimensions/${file}\nexport const ${name}: ${type} = ${JSON.stringify(json, null, 2)}\n`
  }
  return out
}

/** Map of relative path → content (string or Buffer) for a TS target. */
function expectedTsFiles(hash) {
  const files = new Map()
  const add = (dir, rel) => {
    const names = fs
      .readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f) && f !== "dimension-tables.ts" && fs.statSync(path.join(dir, f)).isFile())
      .sort()
    for (const f of names) files.set(rel + f, HEADER + "\n" + fs.readFileSync(path.join(dir, f), "utf8"))
  }
  add(SRC_TS, "")
  for (const sub of TS_SUBDIRS) add(path.join(SRC_TS, sub), sub + "/")
  files.set("dimension-tables.ts", HEADER + "\n" + buildDimensionTables(hash))
  return files
}

function expectedCadFiles(hash) {
  const files = new Map()
  for (const f of dimensionFiles()) files.set(`dimensions/${f}`, fs.readFileSync(path.join(SRC_DIM, f)))
  for (const f of goldenFixtureFiles()) files.set(`fixtures/${f}`, fs.readFileSync(path.join(SHARED, "fixtures", f)))
  files.set(LOGO, fs.readFileSync(path.join(SHARED, LOGO)))
  const manifest = {
    generated_by: "scripts/sync-cpq-shared.mjs",
    tables_hash: hash,
    files: Object.fromEntries([...files.keys()].sort().map((k) => [k, sha256(files.get(k))])),
  }
  files.set("MANIFEST.json", JSON.stringify(manifest, null, 2) + "\n")
  return files
}

/** Every file under dir, as relative posix paths. */
function listFiles(dir, rel = "") {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...listFiles(path.join(dir, e.name), rel + e.name + "/"))
    else if (e.isFile()) out.push(rel + e.name)
  }
  return out
}

function sameContent(p, content) {
  if (!fs.existsSync(p)) return null
  const current = fs.readFileSync(p)
  return current.equals(Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8"))
}

function syncTarget(target, files, check, drift) {
  const dir = path.join(ROOT, target)
  for (const [name, content] of files) {
    const p = path.join(dir, name)
    const same = sameContent(p, content)
    if (same) continue
    if (check) drift.push(`${target}/${name} ${same === null ? "(missing)" : "(differs)"}`)
    else {
      fs.mkdirSync(path.dirname(p), { recursive: true })
      fs.writeFileSync(p, content)
    }
  }
  for (const name of listFiles(dir)) {
    if (files.has(name) || path.basename(name) === ".DS_Store") continue
    if (check) drift.push(`${target}/${name} (stale: not in shared/cpq)`)
    else fs.unlinkSync(path.join(dir, name))
  }
}

function main() {
  const check = process.argv.includes("--check")
  const hash = tablesHash()
  const tsFiles = expectedTsFiles(hash)
  const cadFiles = expectedCadFiles(hash)
  const drift = []

  for (const target of TS_TARGETS) syncTarget(target, tsFiles, check, drift)
  syncTarget(CAD_TARGET, cadFiles, check, drift)

  const logo = fs.readFileSync(path.join(SHARED, LOGO))
  const logoPath = path.join(ROOT, STOREFRONT_LOGO)
  const logoSame = sameContent(logoPath, logo)
  if (!logoSame) {
    if (check) drift.push(`${STOREFRONT_LOGO} ${logoSame === null ? "(missing)" : "(differs)"}`)
    else fs.writeFileSync(logoPath, logo)
  }

  const targets = TS_TARGETS.length + 1
  if (check) {
    if (drift.length) {
      console.error("cpq-shared drift detected. Run: node scripts/sync-cpq-shared.mjs")
      for (const d of drift) console.error("  " + d)
      process.exit(1)
    }
    console.log(
      `cpq-shared: ${targets} targets in sync (${tsFiles.size} TS files each, ${cadFiles.size} cad-service files; tables ${hash})`,
    )
    return
  }

  // Canonical folder copy, git-ignored, no header, so shared/cpq/ts type-checks on its own.
  fs.writeFileSync(CANONICAL_TABLES, tsFiles.get("dimension-tables.ts").slice(HEADER.length + 1))
  console.log(
    `cpq-shared: wrote ${tsFiles.size} TS files into ${TS_TARGETS.join(", ")} and ${cadFiles.size} files into ${CAD_TARGET} (tables ${hash})`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
