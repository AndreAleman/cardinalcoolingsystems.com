---
status: accepted
supersedes: 0002
---
# Payment path is decided by shipment weight and the Company's invoice switch

Decided 2026-08-31 with the owner; supersedes the $10,000 deposit threshold
of ADR-0002.

How an Order is paid follows one rule function (`backend/src/utils/payment-rules.ts`):

- A Company Cardinal has switched ON (`Company.invoice_payment_enabled`,
  set in Medusa Admin at approval time) pays by invoice — every order,
  any size or weight, is placed unpaid and billed offline.
- Otherwise, **120 lbs** (the UPS parcel limit, whole-shipment weight) is
  the line:
  - at or under 120 lbs: paid in full at the existing card checkout, any
    dollar amount;
  - over 120 lbs and under **$7,500**: freight must be quoted — the order
    can only be a Quote Request;
  - over 120 lbs and $7,500 or more: freight is free, so no quote is
    needed — the order is placed unpaid and marked **50% Deposit due**.
    Cardinal sends the Stripe deposit invoice from admin, and the
    Balance Invoice (net 30) after the goods arrive. Both sends are
    manual admin actions in v1.
- A line whose part has no weight or no price on file, or whose quantity
  exceeds stock, is a Quote-Only Line and rides the quote path.

The same physics apply to guests: a public cart over 120 lbs cannot
check out and is pointed at the guest quote path instead. Guests never
place deposit orders — heavy guest orders are always quoted.

Automatic 50% card capture (ADR-0005's partial-capture design) stays a
possible later upgrade; v1 keeps money movement in Stripe invoices and
bookkeeping on order metadata (`payment_rule`, `deposit_status`).
