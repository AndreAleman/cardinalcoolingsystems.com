---
status: accepted
amends: 0006
---
# Freight is billed at carrier cost and never advertised

Decided 2026-10-06 with the owner.

ADR-0006 said heavy orders at $7,500 or more ship "freight free". The
supplier's own free-freight floor on A270 tube is $10,500–$27,500 at cost
depending on lane, so that promise would have Cardinal paying freight on
most tube orders in the $7,500–$27,500 band.

From now on:

- The site does not publish freight costs, allowances or thresholds. The
  Shipping & Returns page says freight shipments are billed at the
  carrier's actual cost and confirmed before shipping.
- The payment path in `backend/src/utils/payment-rules.ts` is unchanged:
  120 lbs is still the parcel line, heavy orders under $7,500 are still
  quoted, heavy orders at $7,500 or more still take a 50% deposit. The
  $7,500 figure now only selects the deposit path; it is not a free-freight
  promise. Freight on a deposit order is added to the Balance Invoice.
- Parcel "free shipping over $100" is unaffected.

Alternatives considered: raising the free-freight threshold for tube to the
supplier's lane floors ($15,000 / $21,500 in selling price) — correct but
hard to explain and still exposed on cross-country lanes; absorbing freight
at $7,500 — costs 40%+ of gross margin on a cross-country tube order.
