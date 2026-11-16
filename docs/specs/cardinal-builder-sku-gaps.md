# Cardinal Builder: SKU gaps

**Checked:** 2026-10-18, read-only, against the live store catalog (`GET /store/products`, US region, list prices, 83 products / 1,251 variants). The builder-relevant variants are in `backend/src/scripts/data/builder-seed-catalog.json`; `node scripts/builder-seed-catalog.mjs <dump> --report` reprints the per-size coverage.

Plan B1: a BOM line is Instant only when it resolves to a published variant with a price above $0, a weight, and stock that covers the quantity. A line that cannot resolve makes the whole configuration **Quote**. This page lists what is missing so Cardinal can stock it. When a SKU is added (and its pattern is in `shared/cpq/dimensions/bom-templates.json`), the line turns Instant with no code change.

## No SKU on the site

| Role (template) | Builders that use it | Sizes needed | Notes |
|---|---|---|---|
| TC butterfly valve, manual (`valve_bfv`, `TCBFN6-<size>`) | CDU kit `iso=bfv` | 1", 1-1/2", 2", 3", 4" (and DN50/DN80 → 2", 3") | `backend/src/scripts/import-clamp-butterfly-valves.ts` creates TCBFN6-###, but none is published. Only the actuated TCBFESR/TCBFVSR and the weld-end BWBFN6 are live. **The Boyd 10U kit with butterfly valves is Quote until TCBFN6-150 is published.** |
| TC × male NPT adapter (`adapter_mnpt`, `21MP6-` / `21MP4-`) | Transition `b=mnpt` stocked-adapter shortcut | 1"–4" | The product `male-npt-x-weld-end-adapter` exists with no variants. The kit's `far=npt` uses the female adapter (22MP) first, so it is not blocked by this. |
| TC × IPS grooved adapter (`adapter_grv`) | CDU kit `far=grv`; transition `b=grv` shortcut | 1"–4" (kit), up to 8" (transition) | None. |
| TC × 300# flange adapter (`adapter_fl300`) | Transition `b=fl300` shortcut | 1"–8" | None. |
| DIN 11853-2 hygienic flange × TC adapter (`adapter_dn`) | CDU kit `port=dn50` / `dn80` | DN50 (2"), DN80 (3") | None. Confirm DIN 11853-2 vs ISO 2852 before stocking (the kit flags it for review). |
| 316L inline TC strainer (`strainer`) | Strainer page; CDU kit `strainer=short|long` | 1"–6", short and long body, 20/40/100 mesh | None. Only Y-ball check valves (45BY6) are live. **Every strainer page result and every kit with a strainer is Quote.** |
| Stainless braided hose assembly, TC ends (`hose`) | Hose page; CDU kit `run=hose` | 1/2"–4" at 24", 36", 48", 72", TC × TC (also TC × MNPT, TC × 150# flange) | None (only rubber/tygon hose adapters 14MPHR/14MPHT). **Every hose and every hose-run kit is Quote.** |

Not gaps by design: welded spools, transitions and manifolds (always Quote, fabricated), tube cut lengths, and tube-OD weld-on flanges / NPT / grooved / pipe ends on fabricated parts (`end_fabricated`), which the shop makes or sources.

## SKU exists but does not resolve Instant today

These have a published variant at the size, but it fails a B1 check, so the line is Quote until it is fixed.

| SKU | Problem | Where it bites |
|---|---|---|
| TCBVS-150 | 0 in stock | **Boyd 10U kit with ball valves** (1-1/2") |
| TCBVS-075, TCBVS-400 | 0 in stock | Kit `iso=bv` at 4"; manifold drop valves are fabricated anyway |
| 22MP6-050, -075, -100, -150 | weight 0 | Kit `far=npt` at 1" and 1-1/2" (T316L) |
| FLGTC6-300 | 0 in stock | Kit `far=fl150` at 3" (T316L) |
| FLGTC4-100 … FLGTC4-800 | 0 in stock (all) | Kit `far=fl150` with `alloy=t304l`, every size |
| 19MPX6-200 | 0 in stock | Transition `a=tc&b=bwp&od=200` stocked-adapter shortcut |
| 19MPX6-050, -075 | $0 price | (not used by a builder size today) |
| 19MPX4-100 … -300 | 0 in stock | Transition `b=bwp` shortcut with `alloy=t304l` |
| 14AM76-600 | 0 in stock | Falls back to 14WMP6-600 only if the resolver tries the next candidate (see below) |
| 14AM74-100 | 0 in stock | Same; 14WMP4-100 has 830 |
| GTCSW-300, GTCSW-600 | 0 in stock | Kit `gasket=sil` at 3" |

## Note for the resolver (commerce stream)

Candidates are ordered by preference (e.g. long-weld ferrule 14AM76 before short-weld 14WMP6). Several first choices exist but are out of stock while the next one is stocked (14AM76-600 / 14WMP6-600, 14AM74-100 / 14WMP4-100). Taking the first candidate that **resolves** (price, weight, stock) rather than the first that **exists** keeps those lines Instant.

## Data oddities seen

- `16W6P-100` (polished end cap, 316L family) carries the option value T304.
- Clamp families are ranged at small sizes: `13MHHM-050-075`, `13MHHM-100-150`, `16AMP6-050-075`, `16AMP6-100-150`; the templates list the exact-size code first and the range second.
