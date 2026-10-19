# shared/cpq: Cardinal Builder core

The single source of truth for the Cardinal Builder's tables, maths, Part Numbers, Share Links, BOMs and the Engineering View drawing (docs/specs/cardinal-builder-plan.md, B10/B11). Ported from Sanitube's `shared/cpq` (sanitube.us main 88d7d99).

- `dimensions/tube-sizes.json`, `materials.json`: Sanitube's rows, unchanged. `end-connections.json`: Sanitube's types and rows (unchanged apart from the added `mass_lb`) plus Cardinal's `fl150`, `fl300`, `fnpt`, `grv`, `bwp` and `cap`, written by `tools/gen-end-connections.mjs`. `node scripts/check-sanitube-tables.mjs` compares the shared rows with a sibling `sanitube.us` checkout.
- `dimensions/bom-templates.json`: per-role candidate SKU patterns (checked against the live catalog 2026-10-18) and the CDU kit rules. An empty pattern list means nothing is stocked: the line resolves Quote (B1).
- `dimensions/assemblies.json`: manifold layout rules, valve/strainer/hose data, reducer lengths, lead-time labels. Every row carries `source` and `verified: false`.
- `ts/*.ts`: pure modules, ES2021, no DOM/Node APIs, extensionless imports. They compile under the storefront config (bundler, strict, ES5 target) and the backend config (Node16/CJS). `builders.ts` is the registry (`BUILDERS`, `getBuilder`); each builder lives in `builder-*.ts`. Nothing switches on `builder_type`.
- `ts/drawing/*.{ts,tsx}`: the Engineering View sheets (`BuilderSheet`, `DRAWING_VERSION`). JSX plus `import type` from `"react"`; no hooks, no browser APIs; React 18. Bump `DRAWING_VERSION` on any visible change and rewrite the goldens.
- `fixtures/*-golden.json` / `*-golden.svg`: geometry vectors (input options + `expected`) and React 18 sheet renders, written by `backend/src/lib/__tests__/cpq-shared-drawing.unit.spec.ts` with `CPQ_UPDATE_FIXTURES=1`, copied to cad-service.
- `assets/cardinal-logo.svg`: the title-block logo: `storefront/public/images/logo/new-cardinal-cooling-logo.svg` with its white fills turned to the sheet ink `#0a0a0a`, so it shows on the white title block (the storefront original is white, for the dark nav; CairoSVG ignores masks, so the mask-based `logo-main-3.svg` cannot be used). The sync script also copies it to `storefront/public/images/logo/cardinal-logo-ink.svg`, which the on-page drawing uses.

## Editing

1. Edit here, never in the generated copies.
2. Run `node scripts/sync-cpq-shared.mjs`. It writes `backend/src/lib/cpq-shared/` and `storefront/src/lib/cpq/shared/` (GENERATED header, `drawing/`, and `dimension-tables.ts` with `CPQ_TABLES_HASH`), `cad-service/cpq_shared/` (JSON tables, goldens, logo, `MANIFEST.json`), and a git-ignored `ts/dimension-tables.ts` here.
3. Commit all locations. `node scripts/sync-cpq-shared.mjs --check` exits 1 on drift (the backend unit tests run it).

`CPQ_TABLES_HASH` = first 12 hex chars of sha256 over `dimensions/*.json` sorted by name, each fed as `name\0bytes\0`. Any table edit changes it, which invalidates cached CAD Packages.
