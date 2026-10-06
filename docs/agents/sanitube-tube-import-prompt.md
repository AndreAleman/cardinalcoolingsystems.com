# Task: create the A270 tube products on sanitube.us. Nothing more.

Repo: `~/colibri-repos/sanitube.us` (GitHub AndreAleman/sanitube-us, branch `main`). Medusa 2 backend + Next.js storefront on Railway (`INFRA.md` has service domains and IDs; `HANDOFF.md` describes the state; if the backend is down, fix that first with the documented `medusa db:migrate` step and tell Andres). Admin credentials are in `backend/.env` (gitignored); never print them.

## Scope
Create (or complete) the ASTM A270 polished sanitary tube product on the Sanitube store with every size on the list below, **priced per foot exactly as listed**. No margin math, no other products, no site copy changes, no SEO work.

## The list (Sanitube price per foot, October 2026; same as the "Cost / ft" column in `~/Desktop/CCS-Tube-Pricing-2026-10.xlsx`)

| SKU | Size · alloy · wall | Case ft | $/ft |
|---|---|---|---|
| A270P-4100 | 1" T304 0.065" | 300 | 3.86 |
| A270P-4150 | 1-1/2" T304 0.065" | 300 | 4.66 |
| A270P-4200 | 2" T304 0.065" | 300 | 6.15 |
| A270P-4250 | 2-1/2" T304 0.065" | 300 | 6.86 |
| A270P-4300 | 3" T304 0.065" | 200 | 8.37 |
| A270P-4400 | 4" T304 0.083" | 100 | 13.43 |
| A270P-4500 | 5" T304 0.083" | 80 | 31.66 |
| A270P-4601 | 6" T304 0.109" | 40 | 27.24 |
| A270P-4801 | 8" T304 0.109" | 20 | 47.72 |
| A270P-6050 | 1/2" T316 0.065" | 300 | 5.88 |
| A270P-6075 | 3/4" T316 0.065" | 300 | 7.27 |
| A270P-6100 | 1" T316 0.065" | 300 | 4.61 |
| A270P-6150 | 1-1/2" T316 0.065" | 300 | 6.27 |
| A270P-6200 | 2" T316 0.065" | 300 | 10.21 |
| A270P-6250 | 2-1/2" T316 0.065" | 300 | 12.57 |
| A270P-6300 | 3" T316 0.065" | 200 | 15.73 |
| A270P-6400 | 4" T316 0.083" | 100 | 23.61 |
| A270P-6601 | 6" T316 0.109" | 40 | 51.30 |
| A270P-6801 | 8" T316 0.109" | 20 | 73.19 |
| A270P-61000 | 10" T316 0.109" | 20 | 210.10 |
| A270P-61200 | 12" T316 0.109" | 20 | 235.50 |

## How
- Pattern: `~/colibri-repos/cardinalcoolingsystems.com/scripts/seo/apply-tube-pricing.py` (read-only reference; it did the same job on Cardinal). Write the Sanitube version in `backend/src/scripts/` following the import-script style already in that folder (idempotent, dry run by default, `apply` to write).
- One product, options Alloy × Size (Tube OD) × Wall, one variant per row with the SKU exactly as above, price per foot in USD, weight in lb per foot = `10.93 × (OD − wall) × wall`, metadata `unit: ft`, `case_qty_ft`, `priced_at: 2026-10`. Inventory per `SHIPPING-PLAN.md` (KC and Paramount stock locations) if those exist; otherwise `manage_inventory: false` and say so.
- If a tube product already exists, update it in place; never create a duplicate.
- Show the dry-run table to Andres and get a yes before `apply`. Then confirm on the live storefront that one variant shows its per-foot price.

## Out of scope (do not do)
Pipe, fittings, pricing changes to anything else, SEO titles, freight copy, quote forms, blog, directories. If something outside this list looks necessary, stop and ask.

## Deliverable
One PR with the script, and a short note: product handle, variant count, what was created vs updated, and the live URL checked.
