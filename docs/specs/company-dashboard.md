## Problem Statement

Cardinal's business buyers (engineers and purchasing staff at CDU makers, MEP firms, colo operators — and soon food-processing plants) reorder the same parts over and over. Today they have to browse the public catalog like a retail shopper, one product page at a time, at list prices, with a quote flow that is a bolt-on contact form. There is no company account, no per-company pricing on screen, no way to reorder, no way to hand off a purchase order, and no way for coworkers to share an account. Large orders that exceed stock, or run past $10k, are handled by phone and email. Cold-email traffic lands on a site that cannot show them a reason to sign up.

## Solution

A one-page **Dashboard** for **Companies**. A visitor signs up, names their Company, and instantly sees a **Welcome Code**; Cardinal approves the Company in Medusa Admin and the Dashboard unlocks. On that one page a **Team Member** types part numbers into a **Quick Order** table (or drops a **PO Upload** and lets Cardinal read it), sees their Company's prices and stock per line, and either pays or sends a **Quote Request** — without ever leaving the page. Orders under the **Deposit Threshold** are paid by card in full; at or above it, a 50% **Deposit** (card or ACH) plus a **Balance Invoice**. Lines that exceed stock are **Quote-Only**. Quotes are priced in Medusa Admin, negotiated by **Quote Message**, and accepted and paid on the Dashboard. **Spend Tiers**, **Referral Codes**, **Win-Back Codes** and **Reorder Nudges** give buyers a visible money reason to keep ordering from the Dashboard. Finally, the public site advertises the Dashboard to cold-email traffic.

Vocabulary is defined in `CONTEXT.md`; decisions in `docs/adr/0001`–`0005`.

## User Stories

### Signing up and getting approved
1. As a visitor, I want to sign up with my email, password and company name, so that I get a Company and become its first Team Member.
2. As a new Team Member, I want to see my Welcome Code on screen the moment I sign up, so that I have a reason to stay and order.
3. As a new Team Member, I want the Welcome Code emailed to me, so that I can find it later.
4. As a Team Member of a Pending Company, I want to sign in and see a clear "waiting for approval" screen with my Welcome Code, so that I know what happens next.
5. As Cardinal, I want an email when a Company signs up, so that I can approve it quickly.
6. As Cardinal, I want to approve or decline a Company in Medusa Admin, so that only real buyers get the Dashboard.
7. As a Team Member, I want an email when my Company is approved, so that I come back and order.
8. As a Team Member, I want the Welcome Code to work once, on any order size, for 30 days, so that the deal is simple.
9. As Cardinal, I want the Welcome Code to be tied to the Company, not the person, so that five coworkers cannot each get 10% off.

### Team
10. As a Team Member, I want to invite a coworker by email, so that they can order for our Company.
11. As an invited coworker, I want to click the invite link, set a password, and land on the Dashboard already attached to the Company, so that I don't have to sign up from scratch.
12. As a Team Member, I want to see who is on my team and their Role, so that I know who can order.
13. As a Team Member, I want every new person to be an `admin` for now, so that nobody is blocked while roles are unused.
14. As Cardinal, I want `member` and `manager` Roles to exist in the system, so that I can turn them on later without a rebuild.
15. As Cardinal, I want to change a Team Member's Role, Spending Limit, or remove them in Medusa Admin, so that I can manage a Company for a client.

### Quick Order
16. As a Team Member, I want a Quick Order table at the top of the Dashboard, so that ordering is the first thing I see.
17. As a Team Member, I want to type a part number or name and get matching parts as I type, so that I don't have to browse.
18. As a Team Member, I want each Order Line to show my Company's price, so that I see what I will actually pay.
19. As a Team Member, I want each Order Line to show stock on hand, so that I know what can ship now.
20. As a Team Member, I want an Order Line whose quantity exceeds stock to become a Quote-Only Line, clearly marked, so that I am not surprised at checkout.
21. As a Team Member, I want a Quote-Only Line to keep its quantity and be included when I send a Quote Request, so that I don't retype it.
22. As a Team Member, I want to change quantities and remove lines inline, so that fixing the list is fast.
23. As a Team Member, I want my Quick Order list to survive a page reload, so that I don't lose work.
24. As a Team Member, I want a running total of the Buyable Lines, so that I know if I am near the Deposit Threshold.
25. As a Team Member, I want to enter a PO Number for the order, so that my accounting can match it.
26. As a Team Member, I want a "Review & pay" button and a "Send as quote" button at the bottom, so that both paths are one click.
27. As a Team Member, I want "Review & pay" to be unavailable when any line is Quote-Only, with a message telling me why, so that I understand the rule.
28. As a Team Member, I want to star a part as a Favorite from the Quick Order table, so that I can find it next time.
29. As a Team Member, I want a Favorites list on the Dashboard with one-click add, so that regular parts take seconds.
30. As a Team Member, I want an Order Again list showing parts from my Company's past Orders, so that reorders take one click.

### Paying
31. As a Team Member, I want "Review & pay" to take my Quick Order lines straight to a checkout with my saved addresses, so that I don't rebuild a cart.
32. As a Team Member, I want to apply a Welcome, Referral or Win-Back Code at checkout, so that I get the discount.
33. As a Team Member, I want an Order under $10,000 to be paid in full by card, so that nothing changes from how the site works today.
34. As a Team Member, I want an Order at or over $10,000 to show me clearly that I pay 50% now and 50% on a Balance Invoice, so that there is no surprise.
35. As a Team Member, I want to choose card or ACH for the Deposit, so that I can pay how my company pays.
36. As a Team Member choosing ACH, I want the Order placed as awaiting payment and a Stripe invoice for the Deposit emailed to me, so that I can pay by bank transfer.
37. As a Team Member choosing card, I want only the Deposit charged now, so that my card is not hit for the full amount.
38. As a Team Member, I want an email confirming the Deposit with the Balance Invoice attached, so that I can forward it to accounting.
39. As Cardinal, I want one Order in Medusa Admin with the full total, the Deposit recorded as a payment, and the balance shown as outstanding, so that reporting is whole.
40. As Cardinal, I want to mark the Balance Invoice paid in Medusa Admin, so that the Order shows fully paid.

### Quote Requests and Quotes
41. As a Team Member, I want "Send as quote" to send all my lines (buyable and quote-only) with my PO Number and a note, so that Cardinal has everything.
42. As Cardinal, I want an email when a Quote Request arrives, so that I can price it.
43. As Cardinal, I want to price each line in Medusa Admin and send the Quote, so that the buyer sees it on the Dashboard.
44. As a Team Member, I want an email when a Quote is ready or revised, so that I come back.
45. As a Team Member, I want to see my Quotes on the Dashboard grouped by who is blocked — waiting on me, waiting on Cardinal, accepted, rejected — so that I know what to do.
46. As a Team Member, I want to accept a Quote and pay for it right there (card in full, or Deposit rules at $10k+), so that a quote becomes an order in one step.
47. As a Team Member, I want to reject a Quote, so that Cardinal stops waiting.
48. As a Team Member, I want to write a Quote Message ("can you do 5% less?"), so that I can negotiate without email.
49. As Cardinal, I want an email when a buyer writes a Quote Message, so that I can respond.
50. As Cardinal, I want to reply with a Quote Message and/or send a revised Quote, so that negotiation closes on the site.
51. As a Team Member, I want a Quote from my Company to be visible to my whole team, so that anyone can accept it.

### PO Upload
52. As a Team Member, I want to drop a PDF or image of my purchase order on the Dashboard, so that I don't retype it.
53. As a Team Member, I want the site to read part numbers, quantities and the PO Number from the document, so that the Quick Order table fills itself.
54. As a Team Member, I want to see the PO Read-Out as a table with Cardinal's prices and stock, so that I can check it before I commit.
55. As a Team Member, I want a line whose PO price is lower than my Company's price to show a Price Alarm, so that I notice the mismatch.
56. As a Team Member, I want a line whose PO price is higher than my Company's price to silently show my Company's price, so that I never overpay.
57. As a Team Member, I want to fix any misread line, so that a bad read does not become a bad order.
58. As a Team Member, I want lines the site could not match to a part to be flagged, so that I can pick the right one or send the list as a quote.
59. As a Team Member, I want to go from the PO Read-Out straight to "Review & pay" or "Send as quote", so that the upload saves me the whole trip.
60. As Cardinal, I want an email with the original document and the read-out whenever a PO is uploaded, so that a bad read never slips past quietly.

### Orders and visibility
61. As a Team Member, I want to see my Company's recent Orders with status on the Dashboard, so that I don't need a separate page.
62. As a Team Member, I want to open an Order and download its invoice, so that I can file it.
63. As a Team Member with `admin` Role, I want to see every Order anyone on my team placed, so that I can manage spend.
64. As a Team Member with `member` Role (later), I want to see only my own Orders, so that visibility matches Role.

### Approvals and Spending Limits (built, off by default)
65. As a Company `admin`, I want an Approval Setting "orders from members need admin approval", so that I can control spend when I add members.
66. As a `member` (later) placing an order under a Company with the Approval Setting on, I want the order held and my admin emailed, so that it is not paid without sign-off.
67. As a Company `admin`, I want to approve or reject held orders on the Dashboard, so that the member can proceed.
68. As a `member`, I want an email when my order is approved or rejected, so that I know.
69. As Cardinal, I want to set a Spending Limit and Reset Window per Team Member in Medusa Admin, so that a client can cap a buyer.
70. As a Team Member over my Spending Limit, I want checkout blocked with a clear message, so that I know why.
71. As a Team Member with a Spending Limit of zero, I want no limit applied, so that the default is unrestricted.

### Pricing and Spend Tiers
72. As Cardinal, I want each Company attached to a Price List, so that different customers see different prices.
73. As Cardinal, I want new Companies to start on standard catalog prices, so that setup is zero-touch.
74. As Cardinal, I want to attach a Custom Price List to a Company in Medusa Admin, so that negotiated deals show on the Dashboard.
75. As a Team Member, I want a bar on the Dashboard showing this year's spend and how far to the next Spend Tier, so that I have a reason to consolidate orders here.
76. As a Company, I want to move to Silver at $10,000 and Gold at $25,000 calendar-year spend automatically, so that nobody has to ask.
77. As a Company on the Standard Price List, I want Silver to mean 3% off and Gold 6% off, so that the tier is worth something.
78. As a Company on a Custom Price List, I want Silver to mean 1% off and Gold 2% off on top of my custom prices, so that I am still rewarded.
79. As Cardinal, I want tiers to reset on January 1, so that the reward is for current-year loyalty.
80. As Cardinal, I want the tier thresholds and percentages editable in one place, so that I can tune them.

### Referral, Win-Back, Reorder Nudge
81. As a Team Member, I want a referral link I can send to someone at another company, so that I can earn a reward.
82. As Cardinal, I want the referring Company to receive a $100 Referral Code when the referred Company's first Order is $1,500 or more, so that referrals bring real business.
83. As a Team Member, I want the Referral Code to work once, on an Order of $500 or more, for 90 days, so that the rules are clear.
84. As a Company that has not ordered in 60 days, I want a Win-Back Code for 10% off my next Order of $200 or more, so that I come back.
85. As a Team Member, I want a Reorder Nudge on the Dashboard ("you usually order X every 6 weeks; last order was 7 weeks ago"), so that I don't run out.
86. As Cardinal, I want the win-back and nudge emails to go out by themselves on a schedule, so that I never have to remember.

### Emails
87. As a Team Member or Cardinal, I want every email to use one Cardinal-branded template, so that they look like one company.
88. As Cardinal, I want a failed email to never block the order, quote, or approval it is about, so that a mail outage never loses a sale.

### Marketing
89. As a cold-email visitor, I want a section on the homepage that shows the Dashboard and says what it does, so that I understand the offer in ten seconds.
90. As a cold-email visitor, I want a dedicated landing page with the full pitch and a "Create your company account" button, so that Cardinal can link me straight to it.
91. As Cardinal, I want the landing page and homepage section to stay fast (no heavy scripts), so that outreach traffic converts.
92. As Cardinal, I want the marketing page to show real screens of the working Dashboard, so that nothing on it is a promise.

### Safety and isolation
93. As a Team Member, I want to never see another Company's orders, quotes, prices, team or codes, so that data stays private.
94. As Cardinal, I want the Company for any request resolved from the signed-in Team Member, never from a header or hostname, so that it cannot be forged.
95. As Cardinal, I want Cardinal's cost and margin figures on a Quote to never reach the storefront, so that pricing stays confidential.
96. As Cardinal, I want the public contact form and its `contact_form_submitted` event untouched, so that the current conversion path keeps working.

## Implementation Decisions

**Delivery is in five slices**, each reviewed and released on its own (see Out of Scope for what each excludes). The slices are: (1) Companies, approval, invites, roles, Price Lists, the Dashboard with Quick Order + stock rule + Quote Requests/Quotes + Favorites + Order Again + Orders, Medusa Admin pages, approvals and Spending Limits switched off; (2) Deposit Threshold, Deposit, Balance Invoice, ACH; (3) PO Upload; (4) Spend Tiers, Referral, Win-Back, Reorder Nudge; (5) marketing homepage section and landing page.

**Reference implementation.** The B2B modules, links, workflows, middlewares, admin pages and storefront components are ported from the Accurate Forklift build (a sibling repo derived from the same Medusa B2B starter), minus its subdomain/tenant layer (ADR-0004). Anything that exists there and fits is copied, not rewritten.

**Company module.** The existing `company` module (already registered and migrated in this backend, from the B2B starter) is extended: `Employee.is_admin` becomes a `role` enum (`member | manager | admin`, default `admin` for now) via a hand-written migration that maps existing `is_admin=true` → `admin`; `Company` gains an approval state (`pending | approved | declined`) and the fields needed for Welcome Code issuance. No `subdomain`, no `Location`. Migrations are always hand-written; `medusa db:generate` on a single module is never run (incident recorded in the sibling repo).

**Links.** Employee ↔ Customer (the keystone), Company ↔ CustomerGroup (Price List attachment), Company ↔ Cart, Order ↔ Company (list on the order side), Company ↔ ApprovalSettings, Cart ↔ Approval, Cart ↔ ApprovalStatus, and the read-only Quote links. Company resolution for every store request walks `auth actor → customer → employee → company` in a single shared helper; no `x-company-id` header exists.

**Approval and quote modules** are ported as-is from the sibling: Approval / ApprovalSettings / ApprovalStatus; Quote / Message / LinePricing. `LinePricing` (cost, markup) is admin-only and never serialized on store routes. The approval gate (`requires_approval = role === "member" && ApprovalSettings.requires_admin_approval`) and the approved-cart resume flow are ported unchanged. `requires_sales_manager_approval` is dropped.

**Signup.** A new store signup route creates Customer + Company (pending) + Employee (admin) + a Company-scoped Welcome Code in one workflow, then returns the code so the storefront shows it immediately. Signup emails Cardinal. Approval is a Company state change in Medusa Admin that emails the Company's Team Members. Pending Companies can authenticate but every Dashboard data route returns a `company_pending` error the storefront renders as the waiting screen.

**Invites** reuse Medusa's customer invite pattern: a signed token emailed to the coworker; accepting it creates the Customer and links a new Employee to the inviter's Company.

**Price Lists** use Medusa's native Price List + Customer Group. Every Company owns exactly one Customer Group (the existing link). New Companies use the catalog's standard prices; an active Custom Price List is assigned to one Company and scoped to that Company's Customer Group. This keeps Welcome Codes company-scoped too — a shared "Standard" group would make one Company's code eligible for every Company in the group. Prices on the Dashboard are fetched with the Company's Customer Group context so the storefront never computes a price.

**Quick Order** is a storefront component backed by two store routes: a product search (Meilisearch is already wired) returning variant, Company price and available inventory in one call; and a bulk add-to-cart (ported). The stock rule is a pure function: `quantity > available → quote-only`. The Quick Order list is persisted client-side, keyed by Company. "Review & pay" builds a Medusa cart from Buyable Lines only and hands off to the existing checkout with `po_number` in cart metadata; it is disabled while any Quote-Only Line is present. "Send as quote" creates a Quote Request from all lines including Quote-Only ones via a ported request-for-quote workflow that allows over-stock quantities.

**Quotes** use the ported negotiation workflows (create request → merchant send → customer accept / reject / adjust → messages). Accepting converts to an order and routes through the same payment rules as a direct order.

**Order Again** is derived from the Company's past Orders (no new table). **Favorites** are ported (per person).

**Deposit (slice 2, ADR-0002, ADR-0005).** A cart-completion decision `total >= 10_000_00 (minor units) → deposit` is a pure function. Deposit orders are a single Medusa Order with a custom payment flow that authorizes and captures 50% (Stripe card) or records an ACH payment session and creates a Stripe Invoice for 50% via the Stripe API (ACH-enabled, hosted invoice page). The remaining 50% is a second, uncaptured payment recorded on the same Order and surfaced as "outstanding"; the Balance Invoice PDF is generated from the existing purchase-order/packing-slip PDF tooling and attached to the confirmation email. Marking the balance paid is an admin action on that payment. Net terms do not exist.

**PO Upload (slice 3).** A store route accepts a PDF/image, calls Claude (latest capable model, document/vision input) with a strict JSON schema for `{ po_number, lines: [{ sku_or_description, quantity, unit_price? }] }`, matches lines to variants via the same search used by Quick Order, and returns a PO Read-Out with Company price, stock, `price_alarm` (PO unit price < Company price) and `unmatched` flags. The storefront loads it into the Quick Order table. Cardinal is emailed the original file and read-out. Documents are stored in the existing file provider.

**Spend Tiers (slice 4).** Tier thresholds and discounts live in one config record editable in Admin. A scheduled job recomputes each Company's calendar-year spend from Orders and moves Companies between the Standard/Silver/Gold Customer Groups; Custom-Price-List Companies keep their group and instead receive a Company-scoped percentage promotion (1%/2%). Reset is the Jan 1 run.

**Codes (Welcome, Referral, Win-Back)** are Medusa Promotions created by one shared helper that applies Company scoping (via the Company's Customer Group), single-use, expiry, and minimum-order rules. Referral attribution is a `referred_by_company_id` on Company set from the referral link at signup; the reward fires from an order-placed subscriber when it is the referred Company's first Order and total ≥ $1,500. Win-Back and Reorder Nudge run as scheduled jobs over Order history.

**Emails** extend the existing Resend/React-Email notification module with one shared Cardinal layout; every send is a best-effort step that swallows failures (pattern ported from the sibling).

**Medusa Admin** gets the ported Companies (with approve/decline, employees, price list, approval settings), Quotes (line pricing, send, messages) and Approvals pages.

**Storefront.** The Dashboard replaces the current `/account` overview as a single route with stacked sections; the existing profile/addresses/order-detail pages remain as secondary pages. The legacy admin-credential quote route and localStorage quote context are removed once slice 1 ships. Existing `data-testid` conventions are kept.

**Marketing (slice 5).** A new homepage section between "Why Us" and the quote form, and a static landing page, both server-rendered with no client JS beyond what the layout already ships. The public contact form is untouched.

## Testing Decisions

A good test exercises behaviour a Team Member or Cardinal would notice — status codes, what a route returns, what a rule decides — never internal structure. Tests use glossary vocabulary in their names.

**Seam 1 — Store/Admin HTTP API (primary).** Backend Jest `integration:http` suites boot a real Medusa app with Postgres (`@medusajs/test-utils`, already a dev dependency), seed Companies and Team Members through module services and the remote link, mint customer JWTs, and call store routes end-to-end: signup issues a Welcome Code; pending Company is locked; approval unlocks; invites attach to the right Company; Quick Order search returns Company price and stock; over-stock lines are quote-only; Quote Request/Quote lifecycle; company-orders scope by Role; cross-Company isolation (A cannot read B); deposit orders record a 50% payment; PO Read-Out flags Price Alarm and unmatched lines (Claude call stubbed); tier moves; referral reward fires only at ≥ $1,500. Prior art: the sibling repo's `company-orders`, `companies` and `quotes` HTTP specs and its seeder/JWT utilities, which are copied in along with its `jest.config.js` and test scripts (this backend currently has no test setup).

**Seam 2 — pure rule functions.** Backend Jest `unit` suites for: stock rule (quantity vs available), deposit decision and split, Spend Tier from yearly spend and Tier Discount by Price List kind, Price Alarm comparison, referral eligibility, win-back eligibility window, spending-limit window math (ported with its tests' intent). Prior art: the sibling's `*.unit.spec.ts` seam tests.

**Storefront.** Vitest is added for pure client logic (Quick Order list reducer, "Review & pay" enablement, running total). Playwright is used for one Dashboard smoke test only if the existing e2e database setup runs locally; otherwise it is skipped and noted.

**Per slice**, the full backend suite runs green before review; each ticket runs its own spec files during work.

## Out of Scope

- Per-Company subdomains or branding (ADR-0004).
- Net terms, credit limits, pay-in-full by invoice.
- Buying more than stock on hand with a lead-time warning (ADR-0001 — rejected).
- Locations / multi-site Companies; `manager`-role behaviour beyond existing in the enum.
- Moving the public contact form onto the Quote module; any change to the `contact_form_submitted` path.
- Per-Company catalogs (one shared catalog).
- Points, badges, leaderboards.
- Automated ACH collection inside the site (ACH is via Stripe Invoice).
- Food-processing-specific content; the Dashboard is industry-neutral by construction.

## Further Notes

- The same Dashboard will serve Cardinal's food-processing customers next; nothing in the account code may hard-code "cooling."
- Sizes: Deposit Threshold $10,000; Welcome 10% / once / 30 days / any size; Referral $100 / once / $500+ / 90 days, triggered at referred first Order ≥ $1,500; Win-Back 10% / $200+ after 60 days idle; Silver $10k (3% std / 1% custom), Gold $25k (6% std / 2% custom), calendar year.
- Approvals and Spending Limits are shipped in slice 1 but inert until a Team Member's Role is changed from `admin`.
- Branch: `feat/b2b-company-module`. Uncommitted `dump.rdb`, `middlewares.ts` and `webhooks/` (QuickBooks inventory) on that branch are unrelated and must not be staged with this work.
- Glossary: `CONTEXT.md`. Decisions: `docs/adr/0001`–`0005`.
