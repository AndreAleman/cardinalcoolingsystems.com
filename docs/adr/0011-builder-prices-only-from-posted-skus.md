---
status: accepted
---
# The Builder prices only from posted SKUs

Decided 2026-10-18 with the owner (plan B1).

The Builder could have priced custom work from a formula: tube by the inch, a weld charge per joint, a margin. Competitors' configurators do. We decided instead that the Builder never sets a price. A Configuration is Instant only when every BOM line resolves to a posted variant with a price above $0, a weight and enough stock (the same rule as a Quote-Only Line, ADR-0001 and ADR-0006); its price is the sum of those posted prices. Anything else (a welded spool, a manifold, a cut length, or a part Cardinal does not stock today, such as strainers, braided hoses and grooved adapters) makes the whole Configuration Quote: the page shows the lead time and the promise of a firm quote within one business day, and Todd prices it, benchmarked against the competition.

This is hard to reverse and surprising: a buyer can configure a kit made almost entirely of stocked parts and still get no price because one line, a strainer, is not stocked. We accept that. Every number on the page then already exists in the store, so a page price can never disagree with the cart, and custom work is never priced below what Todd would quote. The missing SKUs are listed in `docs/specs/cardinal-builder-sku-gaps.md`; when Cardinal posts one, its lines turn Instant with no code change, because the BOM names candidate SKUs and the resolver only looks them up.

Alternatives considered: a cost formula per inch and per weld (fast prices, but Cardinal would carry the risk of every formula error on welded work); showing a partial price for the stocked lines next to a Quote badge (rejected: buyers read a partial price as the price).
