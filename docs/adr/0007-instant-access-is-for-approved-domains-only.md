---
status: accepted
---
# Instant access is for Approved Domains only; everyone else waits for Cardinal

On 2026-09-05 we made every signup born Approved so cold-email traffic converts in one sitting (see `docs/specs/company-dashboard.md`, "Instant access"). That left the door open to anyone: a script could create Companies at will, and each one made Cardinal send a Welcome Code email to whatever address the script typed. That is an outbound-spam risk to the same sending reputation our outreach depends on.

We now keep instant access only for the people it was meant for. An **Approved Domain** list holds the email domains of the companies Cardinal is actively emailing (loaded from the Instantly export). A signup whose email domain is on the list is born Approved, exactly as before. Any other signup is born Pending, as ADR-0003 originally had it, and Cardinal approves or declines it in Medusa Admin.

Decisions that hang off this:

- **Match on the exact email domain**, case-insensitive, no subdomain wildcards. Outreach gets forwarded internally, so the buyer who signs up is often a colleague of the person we emailed.
- **Free-mail domains can never be listed** (gmail.com and friends). A free-mail signup is always Pending. They are welcome — small shops run on Gmail — but the form nudges toward a work email.
- **A Pending signup is sent nothing.** No welcome email and no Welcome Code until Cardinal approves; the code is issued and emailed at approval, so it keeps its full 30 days. Cardinal is never made to email an address nobody vetted.
- **A decision keeps the list in step.** Approving a Company lists its domain, so its colleagues skip the queue. Declining removes the domain, so they do not walk straight back in. An import never re-lists the domain of a Declined Company.
- **Decline works on an Approved Company from Medusa Admin.** Approved Domains get in without Cardinal looking first, so the ban hammer has to be reachable.
- **Existing Companies are untouched.** Only new signups are affected.
- **The list lives in the database** (`approved_domain`, in the Company module), not in the repo: the outreach CSV holds prospects' names and is gitignored. `backend/src/scripts/import-approved-domains.ts` loads a CSV and is safe to re-run for each new campaign.
- **Failure is closed.** If the list cannot be read, the signup is Pending, never Approved. An empty list means every signup is Pending.

The pure rule is `backend/src/utils/signup-policy.ts`. Bot protection on the signup and contact endpoints (challenge, rate limits, notification cap) is a separate change.
