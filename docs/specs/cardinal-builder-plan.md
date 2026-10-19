# Cardinal Builder: implementation plan

**Spec:** [cardinal-builder-spec.md](cardinal-builder-spec.md) (David, 2026-10-18).
**Branch:** `ai/cardinal-builder`, cut from `master` 85bb8e9.
**Ported from:** the Sanitube Smart Fitting Builder (`AndreAleman/sanitube-us` main 88d7d99): `shared/cpq`, `cad-service/`, the `cad-request` module and CAD Review.

This plan records the decisions made on 2026-10-18 and the contracts the work streams build against. When the spec and this plan disagree, this plan wins. Change it here first, then in code.

## Decisions

| # | Decision |
|---|---|
| B1 | **The price is never invented.** A line is Instant only when it resolves to a published variant with a price > 0, a weight, and stock ≥ the quantity (ADR-0001, ADR-0006). Any line that cannot resolve (no stocked SKU exists, e.g. strainers, braided hoses, grooved adapters today) makes the configuration **Quote**. The page shows the lead time and the quote promise for it, never a blank. Missing SKUs are listed in `docs/specs/cardinal-builder-sku-gaps.md` so Cardinal can stock them; when they are added the line turns Instant with no code change. |
| B2 | **Pricing.** Logged-in buyers whose Company is Approved see their Company price list price (`calculated_price` with auth). Everyone else sees the list price with "Sign in with your work email for your pricing". **Spend Tiers / Tier Discounts are out of scope** (not built anywhere yet; they become their own project). Every price carries an as-of date (the date of the resolve). |
| B3 | **Quote list = the Medusa cart.** It is shared across the builders and the catalog. Instant lines are real variant line items. A Quote-mode configuration is one custom line item at `unit_price: 0` with server-built metadata `{ builder: true, builder_type, configuration, configuration_display, part_number, pricing_mode: "quote", lead_time, configuration_id }`. Carts holding a builder Quote line cannot be checked out; they go through Guest Quote (anonymous) or Request Quote (Dashboard). |
| B4 | **Guest Quote is hardened** with the same layers as `/store/contact` (rate limit, honeypot, Turnstile; ADR-0008, fails open). The guest-quote modal fires `contact_form_submitted` with `source: "builder"` when the cart holds a builder line, otherwise `source: "cart"`. |
| B5 | **Every resolved configuration is saved** (`build_configuration`). It is upserted by `config_key`: the first creator (email domain, customer id if known) is kept, and `resolve_count` and `last_resolved_at` are bumped, so a debounced resolve can't flood the table. This is the "what to stock next" demand signal. |
| B6 | **Quote workflow.** `quote_line_pricing` gains `benchmark_price` (competitor price, dollars, nullable), `benchmark_source` (text) and `approved_price` (dollars, nullable). `cost` is Todd's price. In admin, the line-pricing panel shows all three and warns when the selling price is not under the benchmark. The existing send flow is unchanged. |
| B7 | **CAD Review is on**, exactly as on Sanitube (`docs/cpq-cad-review-plan.md` there): business email, generate first, held at **Awaiting review**, **Approve & send** emails the link. Staff alerts go to `CAD_REQUEST_INBOX_EMAIL`, which defaults to **aleman@cardinalcoolingsystems.com only** (David, 2026-10-18). The business day uses America/New_York (Miami). |
| B8 | **CAD scope.** STEP + PDF for the **Transition Spool** and the **Row Manifold** (real geometry). The CDU Kit, Strainer and Hose get the SVG drawing and a PDF (drawing + BOM) but **no STEP**: a kit is several stocked parts, not one solid. Kit pages show "STEP files for the stocked parts on request". |
| B9 | **Cardinal runs its own cad-service** (forked into `cad-service/`), deployed by David as a private Railway service. It can't share Sanitube's instance, because the service locks to one tables hash. |
| B10 | **Shared tables.** `shared/cpq/` holds Cardinal's copy of Sanitube's tables (tube sizes, materials, end connections) plus Cardinal additions (flanges, NPT, grooved, butt-weld pipe adapter, end masses, BOM templates). `scripts/sync-cpq-shared.mjs` generates the backend/storefront/cad-service copies with a `--check` drift guard. `scripts/check-sanitube-tables.mjs` compares the rows both sites have against a sibling `sanitube.us` checkout when present, so the two never disagree on a 2" TC ferrule. A real cross-repo package is a later infra decision. |
| B11 | **Part numbers** follow Sanitube: `<endA>-<endB>-<type>-l<len>-<alloydigit>-<od>`, alloy digit 4 = 304L and 6 = 316L, OD = nominal × 100 padded to 3 digits. Ends are sorted so A×B = B×A, except on reducing transitions, where A keeps its size. Kits are `kit-cdu-<8 hex of sha256(canonical BOM)>`. A parser (missing on Sanitube) is added and round-trip tested. |
| B12 | **Gasket default** is EPDM peroxide-cured (`GTCE-*`), the spec's fallback, until Todd answers. Silicone (`GTCSW-*`) and PTFE (`GTCT-*`) are options. A glycol note is shown. |
| B13 | **CDU models** offered by name: Boyd 10U (1.5" TC) only. Vertiv CoolChip CDU 600 is added when its port size is confirmed. Never guess a size. |
| B14 | **Quick disconnects, leak trays, mounting hardware and Cardinal's coupling** are not configured. Each gets a "we can supply" line and a quote link. The manifold offers only a "UQD-ready stub" (FD83 review pending). |
| B15 | **Per-account pages** (`/us/for/[slug]`, `noindex`, left out of the sitemap): one template plus a data file holding the 21 companies. `trigger` and `connection` stay empty unless verified. Boyd is filled from its datasheet (1.5" TC). An empty connection renders the data-center catalog cut at posted prices and asks for connection sizes. |
| B16 | **No DataForSEO calls.** Keyword targets from the spec go into titles, H1s and copy as written; volumes are validated later. |

## URLs and options (canonical query keys, `v=1`)

Decoding is forgiving: an unknown or invalid value falls back to the default and is reported in `ignored`, as on Sanitube. Every page lives under `/[countryCode]/build/...`.

| Builder (`builder_type`) | Path | Keys (default first) |
|---|---|---|
| `cdu-kit` | `/build/cdu-kit` | `cdu` (none\|boyd-10u, pre-fills port), `port` tc100\|tc150\|tc200\|tc300\|tc400\|dn50\|dn80 (tc150), `side` tcs\|fws, `run` hard\|hose, `far` tc\|fl150\|npt\|grv (TCS→tc, FWS→fl150), `len` 12–240 (36), `iso` none\|bfv\|bv, `strainer` none\|short\|long, `gasket` epdm\|sil\|ptfe, `spares` 0\|1, `units` 1–200 (1), `alloy` t316l\|t304l |
| `row-manifold` | `/build/row-manifold` | `header` 300\|400\|600\|800 (400), `drops` 2–48 (12), `pitch` 6–96 (24), `drop` 100\|150, `dstyle` tc\|bv\|uqd, `ends` tc\|fl150\|grv\|cap, `pair` 1\|0, `alloy` t316l\|t304l, `finish` 32\|20, `fill` 1\|0, `inst` 0\|1, `docs` comma list of hydro,mtr,pass,weldmap (hydro,mtr) |
| `transition` | `/build/transition` | `a` tc\|mil\|fil\|pbs\|tbs\|bw, `b` fl150\|fl300\|mnpt\|fnpt\|grv\|bwp, `od` 100–800 (200), `odb` (= od), `len` 2–72 (12), `alloy`, `qty` 1–500 |
| `strainer` | `/build/strainer` | `size` 100–600 (200), `body` short\|long, `mesh` 20\|40\|100, `iso` 0\|1, `dp` 0\|1, `qty` |
| `hose` | `/build/hose` | `size` 050–400 (150), `len` 12–240 (36), `ends` tc-tc\|tc-npt\|tc-fl150, `cover` braid\|silicone\|ptfe, `sleeve` none\|armor\|fire, `qty` |

Content pages: `/build` (index of builders), `/build/connections` (connection explainer), `/sanitary-vs-bpe`, `/build/cdu-kit/boyd-10u` (pre-filled kit, B13), `/for/[slug]` (B15).

## Backend contracts

### `POST /store/build/resolve`

This is a pure read: no side effects except the B5 upsert, which is fire-and-forget. Auth is optional.

Body: `{ builder_type, options }`.

Response:

```
{
  builder_type, options (canonical), ignored: string[], config_key,
  part_number, description, pricing_mode: "instant" | "quote",
  quote_reasons: string[],            // e.g. "No stocked 316L strainer", "Welded spool"
  bom: [{ role, label, sku | null, variant_id | null, qty_per_unit, qty_total,
          unit_price | null, line_total | null, in_stock: boolean | null,
          stock_qty | null, weight_lb | null, lead_time: "stock" | "custom",
          resolved: boolean }],
  units, price_per_unit | null, price_total | null, currency_code: "usd",
  price_basis: "company" | "list", priced_at (ISO date),
  weight_lb_per_unit, lead_time: { kind: "stock" | "custom", label },
  standard_range: { ok, reasons[] }, spec_block: string,
  configuration_id
}
```

### `POST /store/build/quote-lines`

Body: `{ cart_id?, builder_type, options, units?, source_page? }`. With no `cart_id`, a cart is created in the default region.
- Instant: adds the BOM variants. Lines that would exceed stock are still added; the existing quote-only rules then treat them as quote lines.
- Quote: adds one custom line (B3). The metadata is built server-side from a fresh resolve; values from the client are ignored.

Returns `{ cart_id, added: [...] }`.

### CAD (ported from Sanitube)

- `POST /store/cad-requests`: `{ builder_type, options, name, company, email, company_website (honeypot) }`, returns outcome `review | queued | blocked`.
- `/store/cad-downloads/:token...`
- `/admin/cad-requests*` and `/admin/cad-settings`.

### Other contracts

- `GET /admin/build-configurations`, with a simple admin list page (demand signal).
- `POST /admin/quotes/:id/line-pricing` accepts `benchmark_price`, `benchmark_source` and `approved_price` (B6).

## Work streams

The streams branch from this commit and merge back into `ai/cardinal-builder`.

1. **Foundation** (`shared/cpq`, sync script, tests). Runs first, alone.
2. **Commerce backend** (`ai/cardinal-builder-commerce`): resolver and BOM templates, `build_configuration` module, quote-lines, the Guest Quote guard, B6 and its admin UI.
3. **CAD** (`ai/cardinal-builder-cad`): `cad-service/` fork with the transition and manifold geometries plus PDF-only kinds; `cad-request` module, review, emails and admin UI.
4. **Storefront** (`ai/cardinal-builder-storefront`): builder shell, the five pages, content pages, per-account pages, SEO and the sitemap.

## Local setup (never production)

- Database `cardinal_builder` on local Postgres. Ports: backend **9033**, storefront **8033**, cad-service **8193**.
- **Never load `backend/.env` from the main checkout.** It holds production credentials. Use a local env file in the worktree that points only at `localhost`.
- Kill only processes you started.
