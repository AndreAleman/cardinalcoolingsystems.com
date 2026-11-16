# Cardinal Builder Spec

Oct 18, 2026 · David Aleman

## Purpose and positioning

Cardinal's builder should sell data center liquid-cooling assemblies, not generic sanitary spools. Sanitube's Smart Fitting Builder already does spools, sweeps and tees well (alloy, two ends, 1"–12" OD, length to 240", live part number, drawing, STEP/PDF, quote list). Copying it onto cardinalcoolingsystems.com adds nothing except a second place to request a quote.

The difference is the starting point. Sanitube starts from the tube. Cardinal starts from the equipment the buyer is installing: a CDU with 1.5" tri-clamp ports ([Boyd 10U datasheet](https://info.boydcorp.com/hubfs/Thermal/Liquid-Cooling/Boyd-10U-Cooling-Distribution-Unit-CDU.pdf)), a row manifold built to the OCP guideline (304 minimum, inert-gas welded, A380 pickled, 1" sanitary fill points: [OCP TCS manifold guideline](https://www.opencompute.org/documents/ocp-document-submission-guidelines-for-pre-commission-preparation-of-technology-cooling-system-tcs-row-manifolds-revq-pdf-1)), or a hygienic-flange-to-ANSI-150 hose set ([Vertiv CoolChip CDU 600 guide spec](https://www.vertiv.com/4aa3f7/globalassets/shared/vertiv-coolchip-cdu-600-guide-specifications-sl-80239.pdf)). The buyer picks what they are connecting; the builder returns the bill of materials.

Two positioning rules carry through every page:

- Price transparency where it is possible. Kits assembled from stocked SKUs show a live price. Welded custom work shows a lead time and a quote promise, never a blank.
- Sanitary grade as the spec, stated plainly: 3-A certified 304/316L sanitary gives the cleanability and corrosion resistance of ASME BPE without the documentation premium; BPE is available on request at volume.

Audience, in order: purchasing and sourcing at CDU and manifold builders, mechanical contractors fabricating TCS piping, and engineers writing the spec. The builder is also a lead-capture device: every quote list carries a company domain, which feeds the Approved Domains list in the buyer portal.

## Pricing logic

The configurator never sets a price. Todd prices custom work, Cardinal benchmarks it against the competition, and the page only shows a number that already exists in the store. Two modes:

| Mode | Applies to | What the buyer sees | Source of the number |
| --- | --- | --- | --- |
| Instant | Kits made only of stocked SKUs (ferrules, clamps, gaskets, elbows, tees, valves, standard-length hoses) | Exact price, in-stock status, ships in 1–2 days | Sum of the posted SKU prices × quantity, minus the buyer's tier (3% past $10k, 6% past $25k per year) |
| Quote | Anything welded or cut to length: spools, manifolds, transitions, custom hoses | Lead time (3–6 weeks custom), "firm quote within 1 business day, held 90 days", drawing and part number | Todd prices; Cardinal confirms it is under the competition before sending |

The mode is shown as a badge before the buyer finishes configuring, so nobody expects a price the page will not give. Logged-in buyers on an approved domain see their company price list; anonymous buyers see list price with "sign in with your work email for your pricing". Every price carries an as-of date.

## Page 1: CDU Hookup Kit builder

The CDU hookup kit is the page to build first, because it prices instantly and nobody else offers it. Every CDU ships with a supply and return port; the kit is everything between those ports and the facility or TCS pipe.

URL: `/build/cdu-kit?port=tc150&side=tcs&run=hard&len=36&units=4`

Inputs, in order:

1. CDU port connection: 1" TC, 1.5" TC, 2" TC, 3" TC, 4" TC, DN50/DN80 hygienic flange, or "pick my CDU" (a short list of known units with their port pre-filled: Boyd 10U = 1.5" TC; others added as datasheets are confirmed).
2. Which loop: TCS (secondary, to the manifold) or FWS (primary, to the facility). Determines the far-end default: TCS defaults to tri-clamp, FWS defaults to ANSI 150 flange or grooved.
3. Run type: hard pipe (spool) or flexible hose (stainless overbraid, TC ends).
4. Far-end connection: tri-clamp, ANSI 150 flange, NPT, grooved (adapter).
5. Length per run (hose length or spool face-to-face), 12"–240".
6. Isolation: none, butterfly valve, ball valve (sanitary tri-clamp ends, same size as the port).
7. Strainer on supply: none, 316L inline strainer (short or long body).
8. Number of CDUs.

Output: a BOM table, one row per SKU with quantity per CDU and total, a kit price per CDU and total (Instant when every line is stocked; Quote when a spool is included), the pricing mode badge, lead time, and the same Add to Quote List / Share / STEP / PDF actions Sanitube's builder has.

BOM rules (per CDU, per port, so most lines are ×2):

| Component | Rule |
| --- | --- |
| Ferrule (weld or hose end) | 1 per connection, port size |
| Heavy-duty clamp | 1 per tri-clamp joint |
| Gasket | 1 per tri-clamp joint; default EPDM peroxide-cured (matches OCP loop-back guidance), options silicone, PTFE; glycol note shown |
| Valve | If selected, adds 2 joints (2 clamps, 2 gaskets) |
| Strainer | Supply side only; adds 2 joints |
| Transition adapter | If far end is not tri-clamp: TC × flange, TC × NPT, or TC × grooved adapter |
| Hose or spool | Length-priced line; hose is Instant if stocked in standard lengths, spool is Quote |
| Spares | Optional toggle: +10% gaskets and 1 spare clamp per kit |

The page carries a short "why these sizes" note with the datasheet citations, which doubles as the SEO content for the page. Example: "Boyd's 10U CDU lists 1.5-inch sanitary (tri-clamp) ports; Vertiv's CoolChip CDU 600 connects with stainless hygienic fittings and ships a hose set with hygienic flange to ANSI 150."

## Page 2: Row Manifold builder

The row manifold is the highest-value custom part and the one most tied to a published standard, so the page should read like the OCP guideline with a price attached. It is Quote mode, never Instant.

URL: `/build/row-manifold?header=400&drops=12&drop=100&pitch=24&ends=tc&alloy=t316l`

Inputs:

1. Header OD: 3", 4" (default), 6", 8". Titan's data center guide puts 4" as the most common.
2. Number of drops: 2–48, with a pitch (center-to-center) in inches; default 24".
3. Drop size and style: 1" (OCP default) or 1.5"; tri-clamp ferrule, sanitary branch with isolation ball valve, or stub for a quick disconnect (UQD-ready, customer supplies QD).
4. Header ends: tri-clamp, ANSI 150 flange, grooved adapter, capped; supply and return built as a pair by default.
5. Alloy: 316L default, 304L option; surface finish: 32 Ra ID standard, 20 Ra optional.
6. Fill and drain: 1" sanitary fill point (OCP), 0.5" drain, air vent; on by default.
7. Instrument ports: none, 2 × 0.5" TC for temperature and pressure.
8. Pressure test and documentation: hydrostatic test certificate, MTRs by heat number, passivation certificate to ASTM A380, weld map. First two included; others add a line.

Output: a drawing (header with drops at pitch, dimensioned, end styles labeled), weight, a BOM with the tube length, ferrules, valves and caps broken out, lead time (custom production 3–6 weeks per the current terms), and a one-paragraph spec block the buyer can paste into a submittal: alloy, finish, weld method, pickling and passivation, test pressure, certifications.

The page should cite the OCP guideline inline ("Pipework materials are expected to be stainless steel, minimum grade 304"; inert-gas welding; ASTM A380 surface treatment; 1-inch sanitary fittings as typical fill points) and state that the manifold is built to it. That sentence does more selling than any adjective.

What is deliberately out of scope on this page: quick disconnects themselves (Danfoss, Stäubli, CPC, or Cardinal's own coupling once the IP question is settled), leak-detection trays, and mounting hardware. Each gets a "we can supply" line and a quote link, not a configurator.

## Page 3: Transition Spool builder

The transition spool solves the problem every data center loop has: the CDU side is sanitary and the facility side is not. It is the closest page to Sanitube's spool builder and should reuse that code path, with two differences: one end is a non-sanitary connection, and the page is Quote mode.

URL: `/build/transition?a=tc&b=fl150&od=200&len=12&alloy=t316l`

Inputs: end A (tri-clamp, I-line, bevel seat, plain weld, as Sanitube has today), end B (ANSI 150 flange, ANSI 300 flange, NPT male or female, grooved, butt-weld pipe adapter), OD 1"–8", length 2"–72", alloy, optional reducing (A and B different sizes), quantity. Concentric reducers appear automatically when A and B sizes differ.

Output: drawing, weight, part number in the same scheme as Sanitube (`tc-fl150-spool-l12-6-200`), quote promise, lead time. When the configuration matches a stocked adapter (for example a 2" TC × 2" NPT adapter), the page says so and offers the stocked SKU at Instant price instead of a custom spool.

This page also carries the short explainer the whole site needs once: what tri-clamp, I-line, bevel seat, grooved and flanged connections are, with a drawing of each, and which side of a liquid-cooling loop they typically sit on. Engineers coming from HVAC know grooved and flanged; engineers coming from food know tri-clamp; few know both, and the page that teaches the crossover earns the links.

## Page 4: Strainer spools and hose assemblies

These two are small pages that price instantly and give the kit builder its parts, so they ship with Page 1.

Strainer spool (`/build/strainer`): size 1"–6", body short or long, mesh 20/40/100, end style tri-clamp, optional isolation valves either side, optional differential-pressure ports. Output is a stocked 316L strainer plus the clamps and gaskets to install it, Instant price. The page states why: the OCP guideline extends cleanliness requirements to fittings and terminal units, and cold-plate channels run around 100 microns, so a strainer upstream of the CDU is the cheapest insurance in the loop.

Hose assembly (`/build/hose`): size 0.5"–4", length 12"–240", ends tri-clamp both sides or tri-clamp × NPT/flange, cover (stainless overbraid default, silicone or PTFE-lined options), pressure rating shown, optional armor or fire sleeve. Instant price when the length is a stocked standard (24", 36", 48", 72"), Quote for custom lengths. Hoses are what Vertiv ships loose with its CDU and what contractors buy last and in a hurry, so the ship-in-1–2-days promise is the whole pitch.

Both pages feed the CDU kit builder: the kit's valve, strainer and hose lines are these configurators with the size pre-filled.

## Shared components

One builder shell, five configurations. Everything below is built once and reused.

| Component | Behavior |
| --- | --- |
| Part numbering | Same scheme as Sanitube so Todd's shop reads Cardinal part numbers without translation: `<endA>-<endB>-<type>-l<len>-<alloycode>-<od>`; kits get a `kit-` prefix and a hash of their BOM |
| URL state | Every option in the query string (as Sanitube does), so a configuration is a shareable link and an email can deep-link to a pre-filled build |
| Drawing | SVG generated from the geometry; dimensioned; weight shown; "certified drawing on quote approval" for Quote mode |
| CAD downloads | STEP and dimensioned PDF, same as Sanitube; gate behind a work email to capture the domain |
| Pricing badge | Instant / Quote, with one line explaining why, shown before the price |
| Quote list | Shared cart across builders and the catalog; submit returns pricing within one business day; Instant lines can check out directly |
| Lead time | Stocked: ships in 1–2 business days. Custom: 3–6 weeks. Shown per line and for the whole list |
| Portal hooks | Quote lists attach to the buyer's company account; PO upload can reference a saved configuration by part number; Order Again works for kits |
| Spec block | A paste-ready paragraph (alloy, finish, standard, certs) on every output, because that text ends up in a submittal |
| Citations | Datasheet and standard references as footnotes on each page; they are the content, not decoration |

## Data model and API sketch

The app is Next.js on Railway with a Postgres database; the builder needs three tables and three endpoints beyond what the store already has.

Tables:

- `sku` (existing): id, part number, description, size, alloy, end style, list price, stock quantity, weight.
- `configuration`: id, builder type, option JSON, resolved BOM JSON, pricing mode, Instant price if any, weight, created by (domain, user if known), created at. Every build is saved, including anonymous ones; this is the demand signal for what to stock next.
- `quote_list` and `quote_line` (existing): extended so a line can reference a configuration id, and so a quoted line records Todd's price, the competitor benchmark used, and the approved selling price.

Endpoints:

- `POST /api/build/resolve`: body = builder type + options; returns BOM, pricing mode, price (Instant only), weight, lead time, part number. Pure function over `sku`; no side effects; cached by option hash.
- `GET /api/build/drawing/:configId.svg|.pdf|.step`: renders from stored geometry. SVG and PDF server-side; STEP via a separate CadQuery service on Railway.
- `POST /api/quote-list/lines`: adds a configuration to the list; existing submit flow handles the rest.

Resolution logic in one sentence: map options to a BOM template for the builder type, look up each line in `sku`; if every line resolves to a stocked SKU the mode is Instant and the price is the sum of posted prices; otherwise the mode is Quote and the configuration goes to the quote list for Todd.

Sanitube and Cardinal should share the BOM templates and the geometry/weight tables as a small package or a JSON file in a shared repo, so the two sites never disagree on what a 2" TC spool weighs or which ferrule it takes.

## SEO: page structure and keyword targets

The builder pages are the SEO strategy, because each one answers a question an engineer types when a spec lands on their desk, and almost nobody has written those pages yet. Validate volumes with DataForSEO before writing; the targets below are hypotheses ordered by how specific the intent is.

| Page | Primary query hypotheses | Supporting content |
| --- | --- | --- |
| CDU Hookup Kit | "CDU piping connections", "coolant distribution unit tri-clamp", "1.5 tri clamp ferrule 316L", "CDU hose kit" | Datasheet citations, connection sizes by CDU model, gasket compatibility with PG25 glycol |
| Row Manifold | "OCP row manifold", "TCS manifold stainless", "liquid cooling manifold 316L", "data center manifold passivation ASTM A380" | OCP guideline summary, spec block, weld and test documentation |
| Transition Spool | "tri clamp to flange adapter", "tri clamp to grooved", "sanitary to NPT adapter 2 inch", "hygienic flange ANSI 150" | Connection explainer with drawings |
| Strainer | "316L sanitary strainer data center", "liquid cooling loop strainer 100 mesh" | Cleanliness rationale from OCP |
| Hose | "stainless braided hose tri clamp ends", "CDU hose assembly" | Pressure ratings, stocked lengths |
| Explainer | "sanitary stainless vs BPE", "3-A vs BPE fittings", "tri clamp vs I-line" | The sanitary-grade argument, written once |

Rules: one page per question, the question in the H1, the answer in the first sentence, the configurator below it, citations as footnotes. Volumes will be low (tens to low hundreds a month); the value is that the searcher is an engineer or buyer with a live project, and the page ends in a priced BOM rather than a contact form. Track configurations created per landing page as the conversion metric, not sessions.

Second layer, once the pages exist: a page per CDU model ("Boyd 10U CDU connection kit", "Vertiv CoolChip CDU 600 hose set") that deep-links to a pre-filled kit. These are the long-tail terms where a single page can own the result; confirm each model's port spec from its datasheet before publishing, and never guess a size.

## Build order and open questions

Build the CDU kit first because it prices instantly from parts already in the store and proves the shell; the manifold second because it is the highest-value page; the rest reuse both.

1. Builder shell: URL state, pricing badge, quote list integration, drawing component, work-email gate for downloads. Reuse Sanitube's spool builder front end where the two companies agree.
2. Quote workflow: configuration saved, Todd prices, Cardinal records the benchmark and approved price, buyer gets the quote inside one business day.
3. CDU Hookup Kit (Instant; spool option routes to Quote).
4. Strainer and hose pages (Instant).
5. Row Manifold (Quote; spec block, OCP citations).
6. Transition Spool (Quote; stocked-adapter shortcut).
7. Connection explainer page and the sanitary-vs-BPE page.
8. Per-target-account landing pages, one per company on the outreach list, each with its verified trigger, the connection from its datasheet where known, matching parts and posted prices, unlisted and not indexed.

Open questions to settle before step 2:

- [x] Quote turnaround: Todd quotes while traveling; his engineer is backup. Page promises a firm quote within 1 business day.
- [x] CDU models listed by name: launch with units whose port spec is read from the manufacturer's datasheet (Boyd 10U, 1.5" TC; Vertiv CoolChip CDU 600 once the size is confirmed); add one at a time.
- [ ] Gasket default for glycol loops: ask Todd which gasket Sanitube's data center customers order with their clamps; that becomes the default (EPDM peroxide-cured is the OCP loop-back choice if no answer).
- [x] Coupling: manifold page shows "UQD-ready stub" only. Cardinal's coupling stays off the site pending the FD83 freedom-to-operate review.
- [x] STEP generation: separate service on Railway.
- [x] Per-account pages, first 20: Nortek DCC, Boyd, Vertiv, AAON/BASX, Motivair, Munters, STULZ, Chilldyne/Daikin, nVent, Accelevation, Advanced Thermal Solutions, Arizon/DataCool, AIRSYS, Baltimore Aircoil, EVAPCO, McKinstry, Hermanson, Southland, TAS Energy, Harder; plus Ecolab. When no datasheet connection is known, the page leads with the trigger event, shows the data center cut of the catalog (1"–4" tri-clamp ferrules, clamps, gaskets, 90s, tees; 2"–4" butterfly and ball valves; 316L strainers) at posted prices, and asks for connection sizes to price an exact BOM in 48 hours.

## Sources

- [Sanitube Smart Fitting Builder: Build a Spool](https://sanitube.us/smart-fitting-builder/spool?v=1&alloy=t316l&a=tc&b=tc&od=200&len=12)
- [Boyd 10U Cooling Distribution Unit datasheet](https://info.boydcorp.com/hubfs/Thermal/Liquid-Cooling/Boyd-10U-Cooling-Distribution-Unit-CDU.pdf)
- [Vertiv CoolChip CDU 600 guide specifications](https://www.vertiv.com/4aa3f7/globalassets/shared/vertiv-coolchip-cdu-600-guide-specifications-sl-80239.pdf)
- [OCP: Guidelines for pre-commission preparation of TCS row manifolds](https://www.opencompute.org/documents/ocp-document-submission-guidelines-for-pre-commission-preparation-of-technology-cooling-system-tcs-row-manifolds-revq-pdf-1)
- [Titan Fittings: What fittings a data center liquid cooling system needs](https://www.titanfittings.com/articles/data-center-liquid-cooling-fittings)
- [Dixon Data Cooling Solutions catalog](https://canada.dixonvalve.com/sites/default/files/documents/data_cooling_solutions.pdf)

Cardinal Cooling Systems LLC, Miami. Prepared for the Railway/Next.js storefront; Sanitube references are to the live builder at sanitube.us as of the as-of date above.
