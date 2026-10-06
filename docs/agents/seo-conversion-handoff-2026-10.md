# Cardinal Cooling Systems — SEO, conversion and catalog handoff

Written 2026-10-06 for any agent or engineer picking up cardinalcoolingsystems.com. Everything here was verified in the session that produced it; dates are given so you can tell what may have moved. Read it all before changing anything. Secrets are never in this file; it says where they live.

---

## 1. Business context

- **Cardinal Cooling Systems LLC** (owner: Andres Aleman, aleman@cardinalcoolingsystems.com) is a distributor of 304/316L stainless sanitary tube, tri-clamp and butt-weld fittings, valves, hangers and adapters. Positioning: **data center liquid cooling** first (CDU loops, manifolds, glycol/chilled-water secondary loops), food processing second.
- **Cowbird Depot** (cowbirddepot.com, repo `~/colibri-repos/cowbirddepot.com` + portal worktree) sells the same inventory to **food and beverage** buyers. Keyword split decided 2026-09-29: data-center/industrial-cooling terms belong to Cardinal; 3-A, dairy, brewing, I-line, bevel-seat and other food-process terms belong to Cowbird. Do not let the two sites compete for the same query.
- **Supplier:** Sanitube (sanitube.us; Andres also manages that site, now on Medusa). Sanitube will not list Cardinal on its site. Sanitube **cannot source ASME BPE** fittings.
- **Revenue reality (verified from invoices and backend records, 2026-10-05):** six small orders Jan–Mar 2026, all from one customer (empirical foods Inc., a meat processor), ~$1,020 total. Zero data-center orders. Real website inquiries in 2026: Valex (June, 200 pc quote), arsenale.bio (April, welding question), possibly one Gmail checkout-trouble message in July. **Both Valex and arsenale.bio needed ASME BPE and were lost.** Two of three real inquiries asking for the same unstocked product is a product signal.
- **Address and phone, confirmed 2026-09-29:** the Regus office shown on the site (Organization schema in `storefront/src/app/[countryCode]/(main)/layout.tsx` says 333 S.E. 2nd Avenue, Suite 2000, Miami, FL 33131), phone (630) 947-9955. Older invoices show a Cape Coral address; that is stale. Andres lives in Pompano Beach. **Not eligible for Google Business Profile** (virtual office); do not attempt it.
- Business goal in the repo's CLAUDE.md: $5k/mo revenue; conversion event `contact_form_submitted` (PostHog project 436706).

## 2. Repos, environments, where things live

| Thing | Location / value |
|---|---|
| Main checkout | `~/colibri-repos/cardinalcoolingsystems.com` (on branch `feat/signup-bot-protection`; has untracked `CCS-SEO-Action-Plan.xlsx`, `Invoice.zip`, `Apollo-Lists-Audit-2026-10-05.xlsx` in root; do not commit them) |
| Worktrees | `~/colibri-repos/cardinalcoolingsystems-seo-wt` (branch `ai/27-seo-retitles`, merged, safe to remove) · `~/colibri-repos/cardinalcoolingsystems-conv-wt` (currently on `ai/41-freight-copy`; branches `ai/35-quote-path`, `ai/37-article-schema`, `ai/39-tube-pricing` were created here) |
| Default branch / merge target | **`master`** (PRs merge there; `main` is stale, do not use) |
| Branch convention | `ai/<issue-number>-<slug>`; one GitHub issue per unit of work; owner merges |
| Railway project | `cardinal_cooling_systems`; services Backend, Storefront, Bucket, Meilisearch; auto-deploys `master` |
| Production backend | https://backend-production-04a8.up.railway.app (Medusa 2 admin API) |
| Production storefront | https://cardinalcoolingsystems.com (Next.js, all routes under `/us/`) |
| Admin credentials | `backend/.env` in the main checkout: `MEDUSA_ADMIN_EMAIL`, `MEDUSA_ADMIN_PASSWORD` (gitignored). That file also contains pasted curl commands with old JWTs; never print it |
| Sanity (blog CMS) | project `kgdlucjs`, dataset `production`; write token `SANITY_API_WRITE_TOKEN` in `storefront/.env.local` (gitignored) |
| Resend (email) | API key in `backend/.env`; sender `orders@cardinalcoolingsystems.com`; contact-form mail goes to `CONTACT_FORM_EMAIL` = aleman@ |
| PostHog | project 436706 "Cardinal Cooling", proxied through `/ingest` on the storefront (already done; the Inbox "no reverse proxy" report is a false positive). Inbox/signals have no sources configured |
| Google Search Console | connected to the local OpenSEO instance for `sc-domain:cardinalcoolingsystems.com` (OAuth client in Google Cloud project `alp-pagespeed`, test-mode, user aleman@). Credentials in `~/colibri-repos/OpenSEO/.env.local` |
| OpenSEO (DataForSEO wrapper, keyword/rank/GSC tooling) | `~/colibri-repos/OpenSEO`, run with `pnpm dev` → http://localhost:3001, MCP at `/mcp`. Needs Node 22 (`.tool-versions` pinned). Project ids: Cardinal `9ad87b5b-fcc2-45e5-97fb-4168bfefb674`, Cowbird `8d3d0eaa-1f11-40a4-8cb5-511b11f3f3b3`. DataForSEO balance was ~$34 on 2026-09-20; each keyword/SERP pull costs cents |
| Railway CLI | `~/.asdf/installs/nodejs/20.18.0/bin/railway` (run from `backend/`; the asdf shim is broken) |
| Google Merchant Center | **suspended (misrepresentation)**; appeal filed ~2026-10-01 with Google Ads status also pending. Microsoft Ads is the fallback. Do not create a new LLC/site to dodge it |
| Credentials to rotate | Admin password that was in a (now deleted, never committed) script; WooCommerce keys are obsolete (Sanitube moved to Medusa) |

## 3. Decisions log

| Date | Decision |
|---|---|
| 2026-09-27 | Strategy: own the component-level data-center liquid-cooling lane (CDU piping, manifold fittings, secondary-loop tube), not system-level "data center liquid cooling" (Vertiv/Schneider territory). Build a hub by loop stage; make size-level product pages rankable; rewrite category pages with spec tables; stop writing generic evergreen (304 vs 316); earn 20–40 real links instead of the 174 spam ones |
| 2026-09-29 | Cardinal = DC now, food later; Cowbird = food now. Address/phone as above. Python + Microsoft Excel for every spreadsheet (verify via Excel AppleScript; never LibreOffice) |
| 2026-09-29 | Retitles approved (85 pages: 59 retitles, 10 merges, 15 keeps, 2 rebuilds) and applied |
| 2026-10-05 | PRs #28 and #36 merged. Contact-form "leads" from Thomasnet (Jul–Sep) were **supplier-scam scripts**, not buyers; Thomasnet's "conversion rate" must never be cited. Scam classifier added. Thomasnet paid advertising: Andres may test a month; judge by real RFQs only, with a UTM on the listing link |
| 2026-10-05 | Tube pricing: Sanitube October 2026 dealer list applied at **cost ÷ 0.70 (30% margin on selling price), per foot**, sold in 20 ft lengths, `manage_inventory` off (drop-shipped). Sheet: `~/Desktop/CCS-Tube-Pricing-2026-10.xlsx` |
| 2026-10-06 | **Freight (ADR-0009):** no freight costs or thresholds anywhere in the product/cart/checkout UI. The Shipping & Returns policy page states: freight billed at carrier cost, confirmed before shipping; freight allowed at **$15,000+** merchandise value to the contiguous US, **$21,500+** to FL, NY, NJ, DE, New England, OR, WA. `$7,500` in the money rules only selects the 50%-deposit path. Parcel free shipping over $100 unchanged |
| 2026-10-05 | LinkedIn: company page set up; 2 founder posts/week (5 drafts supplied). Newsletter: interview DC people, ~2/week, published on-site, then email/LinkedIn. News digest script for op-eds |
| ongoing | Paid PR releases: ~2/month, each targeting a different "supplier for X" query, on different networks, for AI-Overview/LLM citations (nofollow, no link value) |

## 4. What is live on the site (deployed from `master` on 2026-10-05)

- 52 category pages with query-matching `metadata.seo_title` and `metadata.h1` (storefront reads `metadata.h1 ?? name`); 25 blog posts retitled in Sanity; blog `<title>` suffix removed.
- 7 duplicate posts moved to Sanity drafts; their URLs 301 (next.config.js) to the surviving page.
- `/api/revalidate?tags=categories,blog,products` refreshes caches without a deploy (unauthenticated; low-risk, worth a shared secret later).
- Quote path: "Request a quote for this part" on every product (`?part=&product=`), quote strip on every category page (`?category=`), contact form prefilled from those params; homepage RFQ form replaced by a CTA block (`quote-cta`).
- Lead emails: subject `Quote request from <First Last> — <email domain>`, reply-to the buyer; `[Likely scam]` prefix + reason banner when `backend/src/api/store/contact/scam-signals.ts` matches; PostHog event carries `suspected_scam`, `prefill_part`, `prefill_category`.
- Tube product `id-od-pol-tube-a270-3a-import` (prod_01K5SVZZMX8TRQMH12FKS7AAW3): 21 variants priced per foot, real lb/ft weights, metadata `unit: ft`, `cost_per_ft`, `case_qty_ft`, `sanitube_sku`, `priced_at: 2026-10`.

## 5. PR state (updated 2026-10-06, end of day)

**Merged and live:** #28 retitles/301s/revalidate, #36 quote path + scam classifier, #38 BlogPosting schema, #40 "/ ft" tube label, #42 freight policy + `freightAllowance()`, #43 this handoff.

**Waiting on Andres to merge (all merge clean against master; the backend start command runs `medusa db:migrate`, so #25's migration is safe):**

| PR | What | Note |
|---|---|---|
| #34 | remove unused Cowbird logo files | trivial |
| #30 | `import-clamp-butterfly-valves.ts` script | script only; run later with `apply` after a dry run |
| #29 | Apollo website visitor tracker in `tracking-scripts.tsx` | third-party script on every page; owner wanted it |
| #32 | server-render the category product grid | SEO win; touches `categories/templates/index.tsx` |
| #25 | instant portal access for Approved Domains | includes a migration; see ADR-0007 |
| #44 | tube landing page `/us/stainless-steel-tubing` with per-foot size chart + A312 pipe product (supersedes #31 and #33; close those after merge) | pipe import script included, **not run** |

**Hold:** #26 bot protection (Turnstile, honeypot, rate limits), stacked on #25. Needs `TURNSTILE_SECRET_KEY` (backend), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (storefront), `STOREFRONT_SHARED_SECRET` (both) set on Railway first; Turnstile keys come from the Cloudflare dashboard.

**Close as superseded after #44 merges:** #31, #33.

Branch from `master` after the merges above; the hot files are `product-actions/index.tsx`, `categories/templates/index.tsx`, `payment-rules.ts`, `product-price/index.tsx`, `stainless-steel-tubing/page.tsx`.

## 6. Scripts and how to run them

All in the Cardinal repo (some only on their branch until merged). Each reads credentials from `backend/.env` or `storefront/.env.local`, falling back to the main checkout when run from a worktree. **Always `--dry-run` first.**

| Script | Purpose |
|---|---|
| `scripts/seo/apply-retitles-medusa.py` (master) | Sets category `seo_title`/`h1` from `scripts/seo/retitles.json` |
| `scripts/seo/apply-retitles-sanity.py` (master) | Patches blog post titles in Sanity from the same JSON |
| `scripts/seo/apply-tube-pricing.py` (`ai/39-tube-pricing`) | Prices/weights/creates tube variants from the embedded October list. Flags: `--dry-run`, `--margin 0.30`, `--unit ft\|stick` |
| `scripts/content/dc-news-digest.py` | Daily data-center news digest → `~/Desktop/dc-news/<date>.md`, scored for liquid-cooling relevance. Feeds: Data Center Knowledge, DCD, Uptime Institute, The Register off-prem, Electronics Cooling, ServeTheHome, Vertiv |
| OpenSEO MCP helper pattern | POST `http://localhost:3001/mcp` with `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":<tool>,"arguments":{...}}}`; tools include `get_ranked_keywords`, `research_keywords` (seeds as `[{"seed":...}]`), `get_serp_results` (queries as `[{"keyword":...}]`), `get_search_console_performance` (`dateRange` enum `last_28_days` etc.), `inspect_urls`, `get_backlinks_profile` |

## 7. Data

### 7a. Tube price list (Sanitube → Cardinal, October 2026, cost per foot; site price = cost ÷ 0.70)

| SKU (Sanitube / site) | Size · alloy · wall | Case ft | Cost/ft | Site $/ft |
|---|---|---|---|---|
| A270P-4100 / AI270P-4100 | 1" T304 0.065" | 300 | 3.86 | 5.51 |
| A270P-4150 | 1-1/2" T304 0.065" | 300 | 4.66 | 6.66 |
| A270P-4200 | 2" T304 0.065" | 300 | 6.15 | 8.79 |
| A270P-4250 | 2-1/2" T304 0.065" | 300 | 6.86 | 9.80 |
| A270P-4300 | 3" T304 0.065" | 200 | 8.37 | 11.96 |
| A270P-4400 | 4" T304 0.083" | 100 | 13.43 | 19.19 |
| A270P-4500 | 5" T304 0.083" | 80 | 31.66 | 45.23 |
| A270P-4601 | 6" T304 0.109" | 40 | 27.24 | 38.91 |
| A270P-4801 | 8" T304 0.109" | 20 | 47.72 | 68.17 |
| A270P-6050 | 1/2" T316 0.065" | 300 | 5.88 | 8.40 |
| A270P-6075 | 3/4" T316 0.065" | 300 | 7.27 | 10.39 |
| A270P-6100 | 1" T316 0.065" | 300 | 4.61 | 6.59 |
| A270P-6150 | 1-1/2" T316 0.065" | 300 | 6.27 | 8.96 |
| A270P-6200 | 2" T316 0.065" | 300 | 10.21 | 14.59 |
| A270P-6250 | 2-1/2" T316 0.065" | 300 | 12.57 | 17.96 |
| A270P-6300 | 3" T316 0.065" | 200 | 15.73 | 22.47 |
| A270P-6400 | 4" T316 0.083" | 100 | 23.61 | 33.73 |
| A270P-6601 | 6" T316 0.109" | 40 | 51.30 | 73.29 |
| A270P-6801 | 8" T316 0.109" | 20 | 73.19 | 104.56 |
| A270P-61000 | 10" T316 0.109" | 20 | 210.10 | 300.14 |
| A270P-61200 | 12" T316 0.109" | 20 | 235.50 | 336.43 |

Site variants use the `AI270P-` prefix; alloy option values are `T304L`/`T316L`. Weight per foot (lb) = 10.93 × (OD − wall) × wall, an estimate.

### 7b. Sanitube free-freight minimums (at Cardinal's cost)

| Ships from | Destination | Minimum |
|---|---|---|
| Kansas City, MO | rest of Eastern & Central time zones | $10,500 |
| Kansas City, MO | NY, NJ, DE, all New England | $15,000 |
| Kansas City, MO | Florida | $15,000 |
| Kansas City, MO | Mountain & Pacific | $27,500 |
| Paramount, CA | rest of Pacific & Mountain | $10,500 |
| Paramount, CA | Oregon, Washington | $15,000 |
| Paramount, CA | Central & Eastern | $27,500 |

Expressed at selling price (÷0.70): $15,000 / $21,500 / $39,300. The site publishes $15,000 and $21,500 (ADR-0009).

### 7c. Baselines (for the 90-day checkpoint, target end of December 2026)

- DataForSEO 2026-09-27: 85 ranked keywords, ~45 organic visits/mo, none in top 10, zero data-center keywords ranked; 174 referring domains, nearly all link-network spam (onglitch.com, tiptopface.com, myfollicles.com).
- Search Console Jul 2–Oct 2 2026: **7 clicks, 5,755 impressions, 750 queries.** Biggest-impression pages: `/categories/valves` 4,046 @ pos 31; `/categories/butterfly-valves` 3,797 @ 25; `/data-center-cooling` 1,440 @ 41; `/categories/clamp-fittings` 1,464 @ 34; `/categories/tubes` 1,176 @ 24. Best DC query: "stainless steel for data center cooling systems" 162 impressions @ pos 13.
- PostHog 30 days to 2026-09-29: ~210 real visitors + 47 bots; 5 form submissions (all scam); homepage forms 0 in 90 days; page speed fine (one merged post was 56 s LCP).
- Competitors (DataForSEO): sanitaryfittings.us 19.6k visits/2.8k kw (Steel & O'Brien's retail arm), steelobrien.com 7.2k/554 (manufacturer, #2 "sanitary fittings"), csidesigns.com 50k/4.5k (engineering-education content), buyfittingsonline.com 50k/10.9k (thousands of size-specific SKU pages), ferguson.com (ignore). None has a real DC component catalog; their DC pages rank for 0–10 terms each.

### 7d. Keyword targets (full lists in the workbook)

Category/KD-0 terms: sanitary fittings 1,600 · tri clamp fittings 1,000 · stainless steel tubing 5,400 · 304 stainless steel tubing 1,300 · eccentric reducer 1,900 · tri clamp gaskets 320 · sanitary clamps 320 · sanitary tubes 210 · sanitary check valve 210 · tri clamp ferrule 210 · ptfe tri clamp gasket 210 · sanitary ball valve 170 · sanitary butterfly valve 170 · tri clamp dimensions/sizes 170 each · reducing tee 480 · 45 degree elbow 1,000 · plate flange 480.
DC hub terms: closed loop cooling system for data centers 1,600 (KD 14) · cdu data center 880 · coolant distribution unit 390 · cdu cooling 170 ($21 CPC) · in-rack cdu 140 · liquid cooling manifold 70 · data center liquid cooling systems 210.
Do not chase: "data center liquid cooling" (system-level), "quick disconnect" (PC water-cooling + connector OEMs), "304 vs 316" (saturated).

### 7e. Scam patterns seen on the contact form (Jul–Oct 2026)

"what's the best email address to send my document to"; "Dear Valued Supplier … authorization letter from the manufacturer"; "strategic collaboration … NDA first"; SEO/guest-post and web-design vendor spam; offshore "OEM manufacturer" pitches; phone 409-231-0023 reused across two fake companies. Real RFQs name parts, sizes and quantities. **Read submission content before calling anything a lead.**

## 8. The plan (prioritized backlog)

1. Merge #38, #40, #42; request indexing on the three URLs.
2. Reference pages: **tri-clamp dimensions chart** and **sanitary tubing size chart** (spec tables, drawings, links to priced SKUs). These earn links and rank for KD-0 terms where the site already sits at 50–60.
3. Category copy rewrites for the top six (clamp-fittings, tubes, clamp-gaskets, valves, sanitary-ball-valves, butterfly-valves): 200–400 words of spec-led copy, size range, materials, standards, comparison table, FAQ. Store in category `metadata.seo_content` / `faq_items` (the template already renders both).
4. Data-center pillar `/us/data-center-liquid-cooling` organized by loop stage (facility water → CDU → manifold → cold plate), with the 11 existing DC posts as children, each linking to products. Rebuild `/us/data-center-cooling` server-rendered with a query-matching H1.
5. Size-level product pages (one indexable URL per size/alloy), the buyfittingsonline pattern. Catalog scope is the full Sanitube list (1,102 priced SKUs + 693 new parts in `~/colibri-repos/sanitube.us/pricing-reports/`), not just the 83 products on the site.
6. Directories (Thomasnet, GlobalSpec, IQS, Crunchbase, D&B, Bing Places, LinkedIn, DCD profile, Mission Critical buyers guide, Data Center Map), contributed articles (CSE, Electronics Cooling, DCD, Mission Critical), expert-quote platforms. Lists with priorities in the workbook.
7. Press releases ~2/month, distinct target queries, different networks; DCD Marketwatch sponsored piece when budget allows.
8. Cowbird: connect its GSC property to the Cowbird OpenSEO project; build its food-processing silo (I-line, bevel seat, 3-A, brewing).
9. Product gap: find a BPE fittings source (two real inquiries lost to it).
10. Housekeeping: shared secret on `/api/revalidate`; `csv-parse` type-definition error in the storefront `tsc` (pre-existing); 2 pre-existing backend `tsc` errors; rotate the old admin password.

## 9. Known issues

- Google had canonicalized two DC posts (CDU guide, valve-operation guide) to unrelated spam domains after an empty crawl; both render fully now. Fix = PR #38 + manual re-index request.
- `/us/categories/clamp-gaskets` is "Discovered – currently not indexed" (linked only from clamp-fittings).
- Blog pages are statically built and the Sanity client uses the CDN cache; content changes need `/api/revalidate?tags=blog` or a deploy.
- The OpenSEO dev server dies after 10 minutes when launched by an agent (background time limit); run it from a terminal.
- Excel-based verification: never open/save a workbook while Excel already has one open (a stale save once wiped a tab).

## 10. Files on the Desktop

- `CCS-SEO-Action-Plan.xlsx` — tabs: README, Action Plan (33 tasks by week, status dropdown), Retitles (85 rows, approved), Keywords (55 targets), Keyword Gaps (487 competitor terms), Directories, Trade Press, Local, PR Calendar, Budget.
- `Andres-Weekly-Schedule.xlsx` — hours budget, 30-minute weekly grid, daily checklist.
- `CCS-Tube-Pricing-2026-10.xlsx` — tube pricing math + free-freight lanes.
- `dc-news/<date>.md` — daily news digest output.
- `sanitube-agent-prompt.md` — task brief for the Sanitube parity work.

## 11. Working rules for agents on this repo

- One GitHub issue per unit of work, branch `ai/<issue>-<slug>` from `master`, PR with a Verification section that says exactly what ran (`tsc`, `jest`) and what did not. Andres merges.
- Use a git worktree; do not switch branches in the main checkout (Andres works there).
- Dry-run every production write (Medusa admin API, Sanity) and show the change list first. Never print `.env` files or tokens.
- Spreadsheets: Python (openpyxl) and verify in Microsoft Excel via AppleScript, guarding against an already-open workbook. No LibreOffice.
- Copy style: short declarative sentences, spec tables over prose, real part numbers, no marketing adjectives, no AI tells. Run a de-slop pass before shipping any page text.
- Treat every "lead" claim with suspicion until the submission content has been read. Never cite Thomasnet conversion numbers.
- Keep CONTEXT.md vocabulary (Company, Quote Request, Quote-Only Line, Money Rules, etc.); money-rule changes get an ADR in `docs/adr/`.

---

## 12. Start here, next agent (task queue with specs)

Work the queue top to bottom. Each item is one issue, one branch `ai/<issue>-<slug>` from `master`, one PR. Check Section 5 first: if the listed PRs are not merged yet, ask Andres to merge them before starting anything that touches the hot files.

### T1. Tri-clamp dimensions chart page (reference page, earns links)
- Route: `storefront/src/app/[countryCode]/(main)/tri-clamp-dimensions/page.tsx`, server-rendered, title "Tri-Clamp Dimensions & Sizes Chart (1/2\" to 12\")", H1 "Tri-Clamp Dimensions and Sizes Chart". Add to `storefront/src/app/[countryCode]/sitemap.ts`.
- Table per line size: tube OD, ferrule flange OD, gasket ID, clamp size/style (13MHHM etc.), matching SKUs from the store's clamp-ferrules, clamp-gaskets and clamps categories (query the backend; SKU families `14M…` ferrules, `40MP…` gaskets, `13MHHM…` clamps). Use ISO 2852 / ASME BPE DT-4 tables for flange ODs and verify against the variant option values already in Medusa; if a number cannot be verified, leave the cell out rather than guess.
- One SVG drawing of a clamp joint with the labeled dimensions (inline SVG, no external image).
- FAQ + FAQPage JSON-LD (copy the pattern in `stainless-steel-tubing/page.tsx`), short answers only.
- Link to it from `/categories/clamp-fittings`, `/categories/clamp-gaskets`, `/categories/clamps`, the existing post `/us/blog/dimensions-sizing-tri-clamp-fittings` (which should then link to the chart as the canonical table), and the tubing page.
- Target queries: "tri clamp dimensions" 170/mo, "tri clamp sizes" 170, "tri clamp torque specs" (add a torque row per size if the supplier publishes one; otherwise omit).

### T2. Category copy for the top six (data, not code)
- Categories: `clamp-fittings`, `tubes`, `clamp-gaskets`, `valves`, `sanitary-ball-valves`, `butterfly-valves`.
- Write 200–400 words of spec-led copy into category `metadata.seo_content` (HTML; the template demotes any `<h1>` to `<h2>`) and 4 Q&As into `metadata.faq_items` (JSON array of `{question, answer}`; see `categories/templates/index.tsx`). Content: what the parts are, where they sit in a cooling or process loop, size range, alloys, ends, pressure/temperature notes, standards (3-A, A270, BPE where true), a comparison table where it helps, and which gasket/clamp pairs with what.
- Do it with a script like `scripts/seo/apply-retitles-medusa.py` (merge metadata, never overwrite other keys), `--dry-run` first, approval from Andres, then apply, then `GET /api/revalidate?tags=categories`.
- Style: short declarative sentences, part numbers, no marketing adjectives, nothing that cannot be checked against the catalog.

### T3. Data-center liquid-cooling pillar
- New route `/us/data-center-liquid-cooling` (server-rendered). Structure by loop stage: facility water → CDU → rack manifold → cold plate. Each stage: what Cardinal supplies (link the categories and the priced tube), 2–3 spec notes, and the matching existing posts (the 11 DC posts; list in Section 4 of the Retitles tab).
- Rebuild `/us/data-center-cooling` as a server component with H1 "Stainless Steel Tubing, Fittings & Valves for Data Center Liquid Cooling" and product links, or 301 it to the pillar; pick one, do not keep two pages.
- Every DC post gets a link up to the pillar and 2–3 product links (they currently have none).
- Target queries: "stainless steel for data center cooling systems" (162 impr @ 13 in GSC, the best one), "cdu fittings", "coolant distribution unit piping", "data center manifold fittings", "closed loop cooling system for data centers".

### T4. Size-level product pages
- Today sizes live in `?alloy=&size=` query params on one product URL, so Google sees one page per product. Design: one indexable URL per size/alloy (route `products/[handle]/[variant-slug]` or canonical variant pages), with a spec table (OD, wall, weight, pressure rating where known, part number) and title `2" Tri-Clamp 90° Elbow, 316L | 14MP-200`. Start with the top five products by GSC impressions; measure before expanding.
- Catalog scope is the full Sanitube list (`~/colibri-repos/sanitube.us/pricing-reports/a-level-price-list-upload.csv`, 1,102 priced SKUs; cost basis = that list; selling price per Andres, 30% margin on tube so far).

### T5. Directories and outreach (no code)
- From aleman@cardinalcoolingsystems.com, submit the Directories tab entries in `CCS-SEO-Action-Plan.xlsx` (Thomasnet first; GlobalSpec, IQS, Crunchbase, D&B, Bing Places, LinkedIn page, DCD profile, Mission Critical buyers guide, Data Center Map). One consistent description: "Cardinal Cooling Systems stocks 304 and 316L stainless sanitary tube, tri-clamp and weld fittings, and valves for data center liquid cooling and food-processing loops. Same-day quotes on parts lists and BOMs." NAP = the Regus Miami address and (630) 947-9955.
- Pitch one contributed article to Consulting-Specifying Engineer or Electronics Cooling (topic: specifying stainless vs polymer piping for secondary loops, with pressure/temperature data).

### T6. Cowbird
- Connect cowbirddepot.com's Search Console property to the Cowbird OpenSEO project (`8d3d0eaa-…`) from its Integrations page (Andres signs in), then repeat the retitle pass for Cowbird with the food-processing keyword set (3-A, dairy, brewing, I-line, bevel seat).

### Weekly, for whoever is on duty
- Run `python3 scripts/content/dc-news-digest.py` each morning and draft one LinkedIn post or op-ed from the top story for Andres to edit.
- Monday: pull Search Console pages at positions 4–20 via OpenSEO and strengthen titles/internal links on the top three.
- Never report form submissions as leads without reading them (Section 7e).
