# Kickoff prompt for the next Cardinal agent

Paste this to start a session in `~/colibri-repos/cardinalcoolingsystems.com`:

---

You are taking over the SEO, conversion and catalog work on cardinalcoolingsystems.com. Before anything else, read, in this order: `CLAUDE.md`, `CONTEXT.md`, `docs/agents/seo-conversion-handoff-2026-10.md` (all of it; Section 12 is your task queue), `docs/adr/0006-*` and `docs/adr/0009-*`.

Rules you must follow:
- One GitHub issue per task; branch `ai/<issue>-<slug>` from `master` (never `main`); work in your own git worktree, not the main checkout; open a PR with a Verification section; the owner merges.
- Before starting, check Section 5 of the handoff: if the listed PRs are unmerged, ask the owner to merge them first, because they touch the files you will edit.
- Every production write (Medusa admin API, Sanity) runs as a dry run first and the change list is shown to the owner before applying. Never print `.env` files, tokens or passwords.
- Spreadsheets: Python (openpyxl), verified in Microsoft Excel. No LibreOffice.
- Copy: short declarative sentences, spec tables, real part numbers, no marketing adjectives, no AI tells. No freight costs or thresholds anywhere except the Shipping & Returns page.
- Never call a form submission a lead until you have read its content; Thomasnet-referred submissions have all been scams.
- Report blockers plainly; do not route around a permission denial.

Start with T1 (tri-clamp dimensions chart). When it is in PR, continue with T2. Post a short status when each PR opens: what is live, what is waiting on merge, what you could not verify.

---
