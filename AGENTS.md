# cardinalcoolingsystems.com — Cardinal Cooling Systems

Medusa-based commerce monorepo for **Cardinal Cooling Systems** — an OWNED
business (Cardinal), not a client. Sells custom metal/cooling components;
target market: data center liquid cooling (CDU makers, immersion cooling,
MEP firms, colo operators).

- `backend/` — Medusa backend (Railway project `cardinal_cooling_systems`).
- `storefront/` — Next.js storefront (cardinalcoolingsystems.com).
- `b2b-starter/` — reference starter the build derives from.

## Working here as an agent

- Tickets come from the Colibri dashboard; branches follow
  `ai/<ticket>-<slug>`.
- Business goal: $5k/mo revenue. The conversion event is
  `contact_form_submitted` (PostHog project 436706 "Cardinal Cooling") — the
  contact/quote flow is the single most important path on the site; treat
  changes to it as high-stakes.
- Cold-email traffic (Instantly campaigns) lands on this site — landing
  pages must load fast and keep working; performance regressions cost real
  outreach money.
- Owned business = slightly more latitude than client sites, but the same
  review gate applies: nothing merges without the admin's approval.

## Agent skills

### Issue tracker

GitHub Issues on this repo, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the root is the glossary, `docs/adr/` holds decisions. See `docs/agents/domain.md`.
