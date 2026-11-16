# cad-service (Cardinal)

Private Python/CadQuery service that turns a Cardinal Builder Configuration into a **CAD Package**
(docs/specs/cardinal-builder-plan.md B8, B9). Forked from Sanitube's cad-service (sanitube.us main
88d7d99): same envelope, auth, PDF path and response shape; Cardinal's tables, geometry and branding.
Stateless: no DB, no storage credentials. The Medusa backend calls it and stores the bytes.

| Kind (`builder_type`) | Route | Output |
|---|---|---|
| `transition` | `POST /v1/packages/transition` | STEP + PDF |
| `row-manifold` | `POST /v1/packages/row-manifold` | STEP + PDF |
| `cdu-kit` | `POST /v1/packages/cdu-kit` | PDF only (drawing + BOM; a kit is several stocked parts, not one solid) |
| `strainer` | `POST /v1/packages/strainer` | PDF only |
| `hose` | `POST /v1/packages/hose` | PDF only |

Request: `{part_number, config, tables_hash, drawing_svg, description}` plus `expected` for the STEP
kinds. `config` is the builder's canonical options object (`shared/cpq/ts/option-keys.ts`);
`expected` is `getBuilder(type).expected(o)`. Response: `{part_number, generator_version, tables_hash,
step | null, pdf | null, solid | null, timings_ms}`.

Errors (`{"error": {"code", "message"}}`): 401 `unauthorized`, 503 `warming_up`, 400
`invalid_config`, 413 `svg_too_large`, 409 `tables_mismatch`, 422 `geometry_mismatch`, 500
`generation_failed`.

## Layout

| Path | What |
|---|---|
| `app/main.py` | FastAPI app: `GET /health`, the five package routes (one handler, `handle_package`) |
| `app/auth.py` | `Authorization: Bearer $CAD_SERVICE_TOKEN` (hmac.compare_digest) |
| `app/schemas.py` | Request/response models, hard limits from `option-keys.ts` |
| `app/tables.py` | Loads `cpq_shared/` (or `$CPQ_SHARED_DIR`), verifies `MANIFEST.json` sha256s, `TABLES_HASH` |
| `app/geometry.py` | Pure-Python ports of TS `transitionGeometry` / `manifoldGeometry` + the parity check |
| `app/model.py` | CadQuery solids: revolved End Connections (outer profile closed against the bore), tube, reducer; manifold header + drops in three booleans |
| `app/step_export.py` | ×25.4 → mm, AP214, product = Part Number, header organization "Cardinal Cooling Systems" |
| `app/pdf.py` | CairoSVG SVG → PDF; `<image>` only from `cpq_shared/assets/` (`cardinal-logo.svg`) or `data:` |
| `cpq_shared/` | **Generated** by `node scripts/sync-cpq-shared.mjs` from `shared/cpq/`. Never edit. |

## Geometry notes

- Transition: tube annulus from End A's weld line, a concentric reducer (revolved frustum annulus,
  `assemblies.json` length by the larger size) right behind End B's weld line when `od != odb`, and
  both End Connections, fused once.
- End Connection bores: `bore_in` null = tube ID; > 0 (FNPT thread envelope, grooved / butt-weld pipe
  ID) = that bore from the face, then a cone to the tube ID where the outer profile cones down;
  0 (cap) = the 2:1 head offset by the tube wall (a closed shell).
- Row Manifold: header + every branch stub outer cylinder (one fuse), every bore (one cut), every
  End Connection and drop valve envelope (one fuse). The header seam is turned to +Z so no branch
  hole crosses it. A 48-drop manifold builds in about 2–3 s locally.
- Drop ball valves (`dstyle=bv`) are an envelope: a hollow cylinder at the TC flange OD and the
  valve's table length, clamped on the drop face.

## Environment

| Var | Meaning |
|---|---|
| `CAD_SERVICE_TOKEN` | Shared secret with the backend. Required unless `CAD_SERVICE_DEV=1`. |
| `CAD_SERVICE_DEV=1` | Local only: start without a token (auth off) or without libcairo (`"pdf": null`). Never set on Railway. |
| `PORT` | Listen port (Docker CMD; default 8080). |
| `CPQ_SHARED_DIR` | Optional: read tables from another folder. |

## Run locally

```bash
cd cad-service
python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt
# or reuse Sanitube's venv: PY=../../sanitube.us/cad-service/.venv/bin/python (same pins)
# PDF needs libcairo; on this Mac the one inside GStreamer.framework works (no nohup):
export DYLD_FALLBACK_LIBRARY_PATH=/Library/Frameworks/GStreamer.framework/Versions/1.0/lib
CAD_SERVICE_TOKEN=local-cad-token .venv/bin/uvicorn app.main:app --port 8193
curl -s localhost:8193/health
```

## Test

```bash
.venv/bin/pytest            # PDF tests skip (with the reason) without libcairo
.venv/bin/pytest -m "not cad"   # skip the CadQuery tests
```

Suites: `test_tables`, `test_geometry_golden` (both golden files, exact `expected` keys),
`test_model` (`cad`: valid solids, STEP re-import in mm, bores open, 48 drops), `test_pdf` (every
sheet golden → one 17 × 11 in page with its Part Number; the logo renders), `test_api` (all five
routes), `test_version` (`GENERATOR_VERSION` = backend `CAD_GENERATOR_VERSION`).

## Deploy

See `docs/specs/cardinal-builder-cad-deploy.md`. Railway: Root Directory `cad-service`, Dockerfile
builder (`railway.json`), healthcheck `/health` (300 s for the cold CadQuery import), **no public
domain**; the backend calls `http://<service>.railway.internal:8080`.

## Versioning

- `app/version.py` `GENERATOR_VERSION` (and the backend `CAD_GENERATOR_VERSION`): bump both on any
  change to the STEP or PDF output; it is in the CAD Package cache key.
- Table changes come through `cpq_shared/` and change `TABLES_HASH`; the backend gets 409
  `tables_mismatch` until both are deployed from the same commit.
